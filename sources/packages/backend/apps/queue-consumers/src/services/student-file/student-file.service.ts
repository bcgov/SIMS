import { Injectable } from "@nestjs/common";
import { DataSource, In, UpdateResult } from "typeorm";
import {
  RecordDataModelService,
  StudentFile,
  VirusScanStatus,
} from "@sims/sims-db";
import { Readable } from "stream";
import { CustomNamedError } from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { ClamAVError, ClamAVService, SystemUsersService } from "@sims/services";
import * as path from "path";
import {
  CONNECTION_FAILED,
  FILE_NOT_FOUND,
  FILE_SCANNING_FAILED,
  SERVER_UNAVAILABLE,
  UNKNOWN_ERROR,
} from "../../constants/error-code.constants";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import {
  CONNECTION_FAILED,
  FILE_NOT_FOUND,
  FILE_SCANNING_FAILED,
  SERVER_UNAVAILABLE,
  UNKNOWN_ERROR,
} from "../../constants/error-code.constants";

export const INFECTED_FILENAME_SUFFIX = "-OriginalFileError";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
    private readonly systemUsersService: SystemUsersService,
    private readonly objectStorageService: ObjectStorageService,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

  /**
   * Scans the file with the provided unique filename
   * for any viruses.
   * @param uniqueFileName unique filename of the file to perform the virus scan.
   * @param processSummary process summary logs.
   * @returns boolean true if the file is virus infected, false otherwise.
   */
  async scanFile(
    uniqueFileName: string,
    processSummary: ProcessSummary,
  ): Promise<boolean> {
    const studentFile = await this.getStudentFile(uniqueFileName);
    if (!studentFile) {
      throw new CustomNamedError(
        `File ${uniqueFileName} is not found or has already been scanned for viruses. Scanning the file for viruses is aborted.`,
        FILE_NOT_FOUND,
      );
    }

    const stream = new Readable();
    // Retrieve the file from the object storage.
    const { body } = await this.objectStorageService.getObject(
      studentFile.uniqueFileName,
    );
    stream.push(body);
    stream.push(null);
    let isInfected: boolean | null;
    let errorName: string;
    let errorMessage = `Unable to scan the file ${uniqueFileName} for viruses.`;
    try {
      isInfected = await this.clamAVService.scanFile(stream);
      if (isInfected === null) {
        errorMessage = `${errorMessage} File scanning failed due to unknown error.`;
        errorName = FILE_SCANNING_FAILED;
      }
    } catch (error: unknown) {
      const virusError = error as ClamAVError;
      if (virusError.code === "ECONNREFUSED") {
        errorMessage = `${errorMessage} Connection to ClamAV server failed.`;
        errorName = CONNECTION_FAILED;
      } else if (virusError.code === "ENOTFOUND") {
        errorMessage = `${errorMessage} ClamAV server is unavailable.`;
        errorName = SERVER_UNAVAILABLE;
      } else {
        errorMessage = `${errorMessage} Unknown error.`;
        errorName = UNKNOWN_ERROR;
        processSummary.error(errorMessage, error);
      }
    }

    // If the file scanning failed or an error occurred, throw a CustomNamedError.
    if (errorName) {
      await this.updateFileScanStatus(
        studentFile.uniqueFileName,
        isInfected,
        studentFile.fileName,
      );
      throw new CustomNamedError(errorMessage, errorName);
    }

    let fileName = studentFile.fileName;
    if (isInfected) {
      processSummary.warn("Virus found.");
      const fileInfo = path.parse(studentFile.fileName);
      fileName = `${fileInfo.name}${INFECTED_FILENAME_SUFFIX}${fileInfo.ext}`;
    } else {
      processSummary.info("No virus found.");
    }
    await this.updateFileScanStatus(
      studentFile.uniqueFileName,
      isInfected,
      fileName,
    );
    return isInfected;
  }

  /**
   * Gets the student file to perform the virus scan.
   * @param uniqueFileName unique filename of the file to perform the virus scan.
   * @returns the student file.
   */
  private async getStudentFile(uniqueFileName: string): Promise<StudentFile> {
    return this.repo.findOne({
      select: {
        id: true,
        fileName: true,
        uniqueFileName: true,
      },
      where: {
        uniqueFileName,
        virusScanStatus: In([
          VirusScanStatus.InProgress,
          VirusScanStatus.Pending,
        ]),
      },
    });
  }

  /**
   * Update the virus scan status of the file.
   * @param uniqueFileName unique file name of the file to update the virus scan status.
   * @param isInfected true if the file is virus infected, false for a clean file and null or undefined when it was not possible to scan.
   * @param fileName filename to be updated if defined.
   * @returns the update result.
   */
  private async updateFileScanStatus(
    uniqueFileName: string,
    isInfected?: boolean,
    fileName?: string,
  ): Promise<UpdateResult> {
    const now = new Date();
    const auditUser = this.systemUsersService.systemUser;
    let virusScanStatus: VirusScanStatus;
    switch (isInfected) {
      case null:
      case undefined:
        virusScanStatus = VirusScanStatus.Pending;
        break;
      case true:
        virusScanStatus = VirusScanStatus.VirusDetected;
        break;
      case false:
        virusScanStatus = VirusScanStatus.FileIsClean;
        break;
    }
    return this.repo.update(
      { uniqueFileName },
      {
        fileName,
        virusScanStatus,
        modifier: auditUser,
        updatedAt: now,
        virusScanStatusUpdatedOn: now,
      },
    );
  }
}

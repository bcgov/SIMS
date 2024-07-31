import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, UpdateResult } from "typeorm";
import {
  RecordDataModelService,
  StudentFile,
  VirusScanStatus,
} from "@sims/sims-db";
import { Readable } from "stream";
import { CustomNamedError } from "@sims/utilities";
import { UNABLE_TO_SCAN_FILE } from "../../constants/error-code.constants";
import { ProcessSummary } from "@sims/utilities/logger";
import { ClamAVService, SystemUsersService } from "@sims/services";
import * as path from "path";

export const INFECTED_FILENAME_SUFFIX = "-OriginalFileError";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
    private readonly systemUsersService: SystemUsersService,
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
      throw new NotFoundException(`Student file ${uniqueFileName} not found.`);
    }
    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);
    const isInfected = await this.clamAVService.scanFile(
      stream,
      processSummary,
    );
    if (isInfected == null) {
      // If the file could not be scanned for any reason,
      // update the file scan status to Pending to keep a
      // track of the files that haven't been scanned yet.
      await this.updateFileScanStatus(studentFile.uniqueFileName, isInfected);
      throw new CustomNamedError(
        `Unable to scan the file ${studentFile.uniqueFileName}`,
        UNABLE_TO_SCAN_FILE,
      );
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
        fileContent: true,
      },
      where: { uniqueFileName, virusScanStatus: VirusScanStatus.InProgress },
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

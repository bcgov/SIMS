import { Injectable } from "@nestjs/common";
import { DataSource, UpdateResult } from "typeorm";
import {
  RecordDataModelService,
  StudentFile,
  VirusScanStatus,
} from "@sims/sims-db";
import { Readable } from "stream";
import { ProcessSummary } from "@sims/utilities/logger";
import { ClamAVService, SystemUsersService } from "@sims/services";
import * as path from "path";
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { CustomNamedError } from "@sims/utilities";
import { FILE_NOT_FOUND } from "@sims/services/constants";

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
   * @param jobData virus scan job data.
   * @param attemptsMade number of attempts made to run this job.
   * @param processSummary process summary logs.
   * @returns boolean true if the file is virus infected, false otherwise.
   */
  async scanFile(
    jobData: VirusScanQueueInDTO,
    attemptsMade: number,
    processSummary: ProcessSummary,
  ): Promise<boolean> {
    const studentFile = await this.getStudentFile(jobData.uniqueFileName);
    if (!studentFile) {
      throw new CustomNamedError(
        `Student file ${jobData.uniqueFileName} not found.`,
        FILE_NOT_FOUND,
      );
    }

    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);
    const virusScanCode = await this.clamAVService.scanFile(stream);
    if (virusScanCode.isInfected == null) {
      if (attemptsMade === 11) {
        await this.updateFileScanStatus(
          studentFile.uniqueFileName,
          virusScanCode.isInfected,
          studentFile.fileName,
        );
      }
      throw new CustomNamedError(
        `Unable to scan the file ${studentFile.uniqueFileName}`,
        virusScanCode.errorCode,
      );
    }

    let fileName = studentFile.fileName;
    if (virusScanCode.isInfected) {
      processSummary.warn("Virus found.");
      const fileInfo = path.parse(studentFile.fileName);
      fileName = `${fileInfo.name}${INFECTED_FILENAME_SUFFIX}${fileInfo.ext}`;
    } else {
      processSummary.info("No virus found.");
    }
    await this.updateFileScanStatus(
      studentFile.uniqueFileName,
      virusScanCode.isInfected,
      fileName,
    );
    return virusScanCode.isInfected;
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

import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, UpdateResult } from "typeorm";
import { RecordDataModelService, StudentFile } from "@sims/sims-db";
import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";
import { Readable } from "stream";
import { CustomNamedError } from "@sims/utilities";
import { UNABLE_TO_SCAN_FILE } from "../../constants/error-code.constants";
import { ProcessSummary } from "@sims/utilities/logger";
import { ClamAVService } from "@sims/services";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
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
    await this.updateFileScanStatus(studentFile.uniqueFileName, isInfected);
    return isInfected;
  }

  /**
   * Gets the student file to perform the virus scan.
   * @param uniqueFileName unique filename of the file to perform the virus scan.
   * @returns the student file.
   */
  private async getStudentFile(uniqueFileName: string): Promise<StudentFile> {
    return this.repo.findOne({
      select: { uniqueFileName: true, fileContent: true },
      where: { uniqueFileName, virusScanStatus: VirusScanStatus.InProgress },
    });
  }

  /**
   * Update the virus scan status of the file.
   * @param uniqueFileName unique file name of the file to update the virus scan status.
   * @param isInfected true if the file is virus infected, false otherwise.
   * @returns the update result.
   */
  private async updateFileScanStatus(
    uniqueFileName: string,
    isInfected: boolean,
  ): Promise<UpdateResult> {
    switch (isInfected) {
      case null:
      case undefined:
        return this.repo.update(
          { uniqueFileName },
          { virusScanStatus: VirusScanStatus.Pending },
        );
      case true:
        return this.repo.update(
          { uniqueFileName },
          { virusScanStatus: VirusScanStatus.VirusDetected },
        );
      case false:
        return this.repo.update(
          { uniqueFileName },
          { virusScanStatus: VirusScanStatus.FileIsClean },
        );
    }
  }
}

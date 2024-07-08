import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, StudentFile } from "@sims/sims-db";
import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";
import { ClamAVService } from "../clamav/clamav.service";
import { Readable } from "stream";
import { CustomNamedError } from "@sims/utilities";
import { UNABLE_TO_SCAN_FILE } from "../../constants/error-code.constants";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

  /**
   * Scans the file with the provided unique filename
   * for any viruses.
   * @param uniqueFileName unique filename of the file to perform the virus scan.
   * @returns boolean true if the file is virus infected, false otherwise.
   */
  async scanFile(uniqueFileName: string): Promise<boolean> {
    const studentFile = await this.getStudentFile(uniqueFileName);
    if (!studentFile) {
      throw new NotFoundException(`Student file ${uniqueFileName} not found.`);
    }
    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);
    const isInfected = await this.clamAVService.scanFile(stream);
    if (isInfected === null) {
      throw new CustomNamedError(
        "Unable to scan the file.",
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
   */
  private async updateFileScanStatus(
    uniqueFileName: string,
    isInfected: boolean,
  ): Promise<void> {
    if (isInfected) {
      await this.repo.update(
        { uniqueFileName },
        { virusScanStatus: VirusScanStatus.VirusDetected },
      );
      return;
    }
    await this.repo.update(
      { uniqueFileName },
      { virusScanStatus: VirusScanStatus.FileIsClean },
    );
  }
}

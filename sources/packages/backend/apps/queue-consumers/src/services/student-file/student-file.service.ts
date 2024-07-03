import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, StudentFile } from "@sims/sims-db";
import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";
import { ClamAVService } from "../clamav/clamav.service";
import { Readable } from "stream";

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
   */
  async scanFile(uniqueFileName: string): Promise<void> {
    const studentFile = await this.getStudentFile(uniqueFileName);
    const stream = Readable.from(studentFile.fileContent);
    await this.clamAVService.scanFile(stream);
  }

  /**
   * Gets the student file to perform the virus scan.
   * @param uniqueFileName unique filename of the file to perform the virus scan.
   * @returns the student file.
   */
  private async getStudentFile(uniqueFileName: string): Promise<StudentFile> {
    return this.repo.findOne({
      select: { uniqueFileName: true, fileContent: true },
      where: { uniqueFileName, virusScanStatus: VirusScanStatus.Pending },
    });
  }
}

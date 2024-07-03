import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, StudentFile } from "@sims/sims-db";
import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";
import { ClamAVService } from "../clamav/clamav.service";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

  /**
   * Scans all the files with pending scan status for viruses.
   */
  async scanFiles(): Promise<void> {
    const studentFiles = await this.getStudentFiles({
      virusScanStatus: VirusScanStatus.Pending,
    });
    await this.clamAVService.scanFiles(studentFiles);
  }

  /**
   * Gets the student files.
   * @param options related options.
   * - `virusScanStatus` virus scan status of the files.
   * @returns the student files.
   */
  private async getStudentFiles(options?: {
    virusScanStatus?: VirusScanStatus;
  }): Promise<StudentFile[]> {
    return this.repo.find({
      select: { uniqueFileName: true, fileContent: true },
      where: { virusScanStatus: options?.virusScanStatus },
    });
  }
}

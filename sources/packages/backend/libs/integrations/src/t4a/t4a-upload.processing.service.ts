import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { getISODateOnlyString } from "@sims/utilities";
import * as Client from "ssh2-sftp-client";
import { SINValidationService } from "@sims/integrations/services";
import { StudentFileSharedService, SystemUsersService } from "@sims/services";
import { FileOriginType } from "@sims/sims-db";
import { v4 as uuid } from "uuid";
import * as path from "path";

@Injectable()
export class T4AUploadProcessingService {
  constructor(
    private readonly t4aIntegrationService: T4AIntegrationService,
    private readonly studentFileSharedService: StudentFileSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly sinValidationService: SINValidationService,
  ) {}

  async process(
    remoteFiles: string[],
    referenceDate: Date,
    processSummary: ProcessSummary,
  ): Promise<void> {
    let sftpClient: Client;
    try {
      sftpClient = await this.t4aIntegrationService.getClient();
      const formattedReferenceDate = getISODateOnlyString(referenceDate);
      for (const remoteFilePath of remoteFiles) {
        await this.processT4AFile(
          sftpClient,
          remoteFilePath,
          formattedReferenceDate,
          processSummary,
        );
      }
    } catch (error: unknown) {
      processSummary.error("Error uploading T4A file", error);
    } finally {
      await this.t4aIntegrationService.ensureClientClosed(
        "Upload T4A files process completed.",
        sftpClient,
      );
    }
  }

  private async processT4AFile(
    sftpClient: Client,
    remoteFilePath: string,
    formattedReferenceDate: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Downloading T4A file ${remoteFilePath}.`);
    try {
      const directory = path.basename(path.dirname(remoteFilePath));
      const userFriendlyFileName = `${directory}-T4A-${formattedReferenceDate}`;
      processSummary.info(`Processing T4A file: ${remoteFilePath}.`);
      // Get the file name, expected to be the SIN of the student.
      const sin = path.basename(remoteFilePath, path.extname(remoteFilePath));
      const student =
        await this.sinValidationService.getStudentByValidSIN("485867568");
      if (!student) {
        processSummary.warn(
          `No student found for SIN ${sin} for T4A file ${remoteFilePath}.`,
        );
        return;
      }
      performance.mark("Start Download");
      const fileBuffer = await this.t4aIntegrationService.downloadFile(
        remoteFilePath,
        {
          client: sftpClient,
        },
      );
      performance.mark("End Download");
      performance.mark("Start Upload");
      await this.studentFileSharedService.createFile(
        {
          fileName: `${userFriendlyFileName}.pdf`,
          uniqueFileName: `${userFriendlyFileName}-${uuid()}.pdf`,
          mimeType: " application/pdf",
          fileContent: fileBuffer,
          groupName: `${directory}-T4A`,
          fileOrigin: FileOriginType.Student,
        },
        student.id,
        this.systemUsersService.systemUser.id,
        processSummary,
      );
      performance.mark("End Upload");
      const fileDownloadMeasure = performance.measure(
        "T4A File Download",
        "Start Download",
        "End Download",
      );
      const fileUploadMeasure = performance.measure(
        "T4A File Upload",
        "Start Upload",
        "End Upload",
      );
      processSummary.info(
        `T4A file downloaded in ${fileDownloadMeasure.duration.toFixed(2)}ms.`,
      );
      processSummary.info(
        `T4A file uploaded in ${fileUploadMeasure.duration.toFixed(2)}ms.`,
      );
      processSummary.info(
        `Total T4A file process time: ${(fileDownloadMeasure.duration + fileUploadMeasure.duration).toFixed(2)}ms.`,
      );
      processSummary.info(`Created T4A file record for ${remoteFilePath}.`);
    } catch (error: unknown) {
      // Register the error but continue processing other files.
      processSummary.error(
        `Error while processing T4A file ${remoteFilePath}.`,
        error,
      );
    }
  }
}

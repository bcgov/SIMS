import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { getISODateOnlyString } from "@sims/utilities";
import * as Client from "ssh2-sftp-client";
import { SINValidationService } from "@sims/integrations/services";
import { StudentFileSharedService, SystemUsersService } from "@sims/services";
import { FileOriginType } from "@sims/sims-db";
import * as path from "path";
import { FILE_HASH_DUPLICATION_ERROR } from "@sims/services/constants";
import { T4A_FILE_PREFIX } from "@sims/integrations/constants";
import { T4AUploadFileQueueInDTO } from "@sims/services/queue/dto/t4a-upload.dto";

/**
 * Service to process the upload of T4A files to student accounts.
 */
@Injectable()
export class T4AUploadProcessingService {
  constructor(
    private readonly t4aIntegrationService: T4AIntegrationService,
    private readonly studentFileSharedService: StudentFileSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly sinValidationService: SINValidationService,
  ) {}

  /**
   * Process the upload of a T4A files batch.
   * @param files Array of files to be processed.
   * @param referenceDate The reference date for processing. Received from
   * the enqueuer to ensure all files in the batches have the same reference date.
   * @param processSummary Summary object to log the process details.
   */
  async process(
    files: T4AUploadFileQueueInDTO[],
    referenceDate: Date,
    processSummary: ProcessSummary,
  ): Promise<void> {
    let sftpClient: Client;
    try {
      processSummary.info("Creating SFTP client and starting process.");
      sftpClient = await this.t4aIntegrationService.getClient();
      const formattedReferenceDate = getISODateOnlyString(referenceDate);
      for (const file of files) {
        const fileProcessSummary = new ProcessSummary();
        processSummary.children(fileProcessSummary);
        await this.processT4AFile(
          sftpClient,
          file,
          formattedReferenceDate,
          fileProcessSummary,
        );
      }
    } catch (error: unknown) {
      processSummary.error("Error uploading file.", error);
    } finally {
      await this.t4aIntegrationService.ensureClientClosed(
        "Upload process completed.",
        sftpClient,
      );
    }
  }

  /**
   * Process a single T4A file: download from SFTP and upload to student account.
   * @param sftpClient Shared SFTP client to be used for file download. Creating
   * a new client for each file would be inefficient.
   * @param file File to be processed.
   * @param formattedReferenceDate Reference date formatted as string for file naming.
   * @param processSummary Summary object to log the process details.
   */
  private async processT4AFile(
    sftpClient: Client,
    file: T4AUploadFileQueueInDTO,
    formattedReferenceDate: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file ${file.uniqueID}.`);
    try {
      // Find the student associate with the SIN in the file name.
      // Get the file name, expected to be the SIN of the student.
      //const sin = path.basename(remoteFilePath, path.extname(remoteFilePath));
      const students =
        await this.sinValidationService.getStudentsByValidSIN("485867568");
      if (students.length > 1) {
        processSummary.warn(
          `The SIN associated with the file ${file.uniqueID} has more than one student associated.`,
        );
        return;
      }
      if (!students.length) {
        processSummary.warn(
          `No student associated with the SIN for the file ${file.uniqueID}.`,
        );
      }
      const [student] = students;
      processSummary.info(`Found student ID ${student.id}.`);
      // Download the file from the SFTP.
      processSummary.info("Start download from the SFTP.");
      const startDownloadTime = performance.now();
      const fileBuffer = await this.t4aIntegrationService.downloadFile(
        file.remoteFilePath,
        {
          client: sftpClient,
        },
      );
      const endDownloadTime = performance.now();
      processSummary.info(
        `File downloaded in ${(endDownloadTime - startDownloadTime).toFixed(2)}ms.`,
      );
      const startUploadTime = performance.now();
      // Upload the file to the student account.
      processSummary.info(`Start upload to the student account.`);
      const directory = path.basename(path.dirname(file.remoteFilePath));
      const extension = path.extname(file.remoteFilePath);
      const userFriendlyFileName = `${directory}-T4A-${formattedReferenceDate}`;
      const fileName = `${userFriendlyFileName}.${extension}`;
      const uniqueFileName = `${userFriendlyFileName}-${file.uniqueID}.${extension}`;
      try {
        await this.studentFileSharedService.createFile(
          {
            fileName,
            uniqueFileName,
            mimeType: "application/pdf",
            fileContent: fileBuffer,
            groupName: T4A_FILE_PREFIX,
            fileOrigin: FileOriginType.Ministry,
          },
          student.id,
          this.systemUsersService.systemUser.id,
          processSummary,
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name === FILE_HASH_DUPLICATION_ERROR
        ) {
          processSummary.info(
            `T4A file for student ID ${student.id} already exists: ${error.message}`,
          );
          return;
        }
        throw error;
      }
      const endUploadTime = performance.now();
      processSummary.info(
        `File uploaded in ${(endUploadTime - startUploadTime).toFixed(2)}ms.`,
      );
    } catch (error: unknown) {
      // Register the error but continue processing other files.
      processSummary.error(
        `Error while processing file ${file.remoteFilePath}.`,
        error,
      );
    }
  }
}

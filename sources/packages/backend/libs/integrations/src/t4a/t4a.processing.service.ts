import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { ConfigService } from "@sims/utilities/config";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { InjectQueue } from "@nestjs/bull";
import { T4AUploadQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";

@Injectable()
export class T4AIntegrationProcessingService {
  private readonly ftpReceiveFolder: string;
  constructor(
    private readonly t4aIntegrationService: T4AIntegrationService,
    @InjectQueue(QueueNames.T4AUpload)
    private readonly t4aUploadQueue: Queue<T4AUploadQueueInDTO>,
    // private readonly studentFileSharedService: StudentFileSharedService,
    // private readonly systemUsersService: SystemUsersService,
    // private readonly sinValidationService: SINValidationService,
    config: ConfigService,
  ) {
    this.ftpReceiveFolder = config.sfasIntegration.ftpReceiveFolder;
  }

  async process(
    maxFileUploadsPerBatch: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Get the list of T4A related directories from SFTP ordered by directory name.
    // Expected format is 2025-1, 2025-2, etc.
    const t4aDirectories =
      await this.t4aIntegrationService.getResponseFilesFullPath(
        `${this.ftpReceiveFolder}/T4A`,
        /[\d]{4}-[\d]{1}/i,
      );
    processSummary.info(`Found T4A directories: ${t4aDirectories}.`);
    // For each directory, get the list of T4A files and queue them for processing.
    for (const directoryPath of t4aDirectories) {
      processSummary.info(`Processing T4A files in ${directoryPath}.`);
      const remoteFilePaths =
        await this.t4aIntegrationService.getResponseFilesFullPath(
          directoryPath,
          /[\d]{9}\.pdf/i,
        );
      processSummary.info(
        `Found ${remoteFilePaths.length} files in ${directoryPath}.`,
      );
      // Create batches of files to be processed.
      while (remoteFilePaths.length > 0) {
        const filesBatch = remoteFilePaths.splice(0, maxFileUploadsPerBatch);
        const queue = await this.t4aUploadQueue.add({
          remoteFiles: filesBatch,
        });
        processSummary.info(
          `Added files batch to ${QueueNames.T4AUpload} queue ID ${queue.id}: ${filesBatch}.`,
        );
      }
    }
  }

  // private async processT4AFiles(
  //   directory: string,
  //   remoteFilePaths: string[],
  //   referenceDate: Date,
  //   processSummary: ProcessSummary,
  // ): Promise<void> {
  //   // TODO: is it safe to log SINs in the logs? They are PII.
  //   const formattedReferenceDate = getISODateOnlyString(referenceDate);
  //   const sftpClient = await this.t4aService.getClient();
  //   try {
  //     for (const filePath of remoteFilePaths) {
  //       console.time(`Processing T4A file: ${filePath}.`);
  //       processSummary.info(`Processing T4A file: ${filePath}.`);
  //       const baseName = path.basename(filePath, path.extname(filePath));
  //       const student =
  //         await this.sinValidationService.getStudentByValidSIN(baseName);
  //       if (!student) {
  //         processSummary.error(
  //           `No student found for SIN ${baseName} for T4A file ${filePath}.`,
  //         );
  //         continue;
  //       }
  //       console.time(`Downloading T4A file: ${filePath}.`);
  //       const fileBuffer = await this.t4aService.downloadFile(filePath, {
  //         client: sftpClient,
  //       });
  //       console.timeEnd(`Downloading T4A file: ${filePath}.`);

  //       console.time(`Renaming T4A file: ${filePath}.`);
  //       await this.t4aService.renameFileA(filePath, `${filePath}_${uuid()}`, {
  //         client: sftpClient,
  //       });
  //       console.timeEnd(`Renaming T4A file: ${filePath}.`);

  //       if (!fileBuffer) {
  //         processSummary.error(`File ${filePath} could not be downloaded.`);
  //         continue;
  //       }
  //       const userFriendlyFileName = `${directory}-T4A-${formattedReferenceDate}`;
  //       await this.studentFileSharedService.createFile(
  //         {
  //           fileName: `${userFriendlyFileName}.pdf`,
  //           uniqueFileName: `${userFriendlyFileName}-${uuid()}.pdf`,
  //           mimeType: " application/pdf",
  //           fileContent: fileBuffer,
  //           groupName: `${directory}-T4A`,
  //           fileOrigin: FileOriginType.Student,
  //         },
  //         student.id,
  //         this.systemUsersService.systemUser.id,
  //         processSummary,
  //       );
  //       processSummary.info(`T4A file processed: ${filePath}.`);
  //       console.timeEnd(`Processing T4A file: ${filePath}.`);
  //     }
  //   } finally {
  //     await this.t4aService.ensureClientClosed(
  //       "T4A files processing",
  //       sftpClient,
  //     );
  //   }
  // }
}

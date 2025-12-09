import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { InjectQueue } from "@nestjs/bull";
import { T4AUploadQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class T4AEnqueuerProcessingService {
  //private readonly ftpReceiveFolder: string;
  constructor(
    private readonly t4aIntegrationService: T4AIntegrationService,
    @InjectQueue(QueueNames.T4AUpload)
    private readonly t4aUploadQueue: Queue<T4AUploadQueueInDTO>,
    //config: ConfigService,
  ) {
    //this.ftpReceiveFolder = config.sfasIntegration.ftpReceiveFolder;
  }

  async process(
    maxFileUploadsPerBatch: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Get the list of T4A related directories from SFTP ordered by directory name.
    // Expected format is 2025-1, 2025-2, etc.
    // const t4aDirectories =
    //   await this.t4aIntegrationService.getResponseFilesFullPath(
    //     `${this.ftpReceiveFolder}/T4A`,
    //     /[\d]{4}-[\d]{1}/i,
    //   );
    const t4aDirectories = ["IN/T4A/LOAD-TEST"];
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
      const enqueueStart = performance.now();
      const referenceDate = new Date();
      while (remoteFilePaths.length > 0) {
        const filesBatch = remoteFilePaths.splice(0, maxFileUploadsPerBatch);
        const queue = await this.t4aUploadQueue.add({
          remoteFiles: filesBatch,
          referenceDate,
        });
        processSummary.info(
          `Added file(s) to ${QueueNames.T4AUpload}, queue ID ${queue.id}.`,
        );
      }
      const enqueueElapsedMs = performance.now() - enqueueStart;
      processSummary.info(
        `Time to queue ${remoteFilePaths.length} files: ${enqueueElapsedMs.toFixed(2)} ms.`,
      );
    }
  }

  async createLoadTestFiles(): Promise<void> {
    let sftpClient: Client;
    const sourceFilePath = "/IN/T4A/LOAD-TEST/000000000.pdf";
    try {
      sftpClient = await this.t4aIntegrationService.getClient();
      for (let i = 1; i <= 1000; i++) {
        await sftpClient.rcopy(
          sourceFilePath,
          `/IN/T4A/LOAD-TEST/${i.toString().padStart(9, "0")}.pdf`,
        );
      }
    } finally {
      await this.t4aIntegrationService.ensureClientClosed(
        "Upload T4A files process completed.",
        sftpClient,
      );
    }
  }
}

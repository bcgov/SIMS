import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { InjectQueue } from "@nestjs/bull";
import { T4AUploadQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { SFTPItemType } from "@sims/integrations/services/ssh";
import { ConfigService } from "@sims/utilities/config";

/**
 * Scan the T4A SFTP IN folder to find all T4A available to be
 * uploaded to the student accounts, and enqueue them for processing.
 */
@Injectable()
export class T4AEnqueuerProcessingService {
  constructor(
    private readonly t4aIntegrationService: T4AIntegrationService,
    @InjectQueue(QueueNames.T4AUpload)
    private readonly t4aUploadQueue: Queue<T4AUploadQueueInDTO>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process the T4A files available on the SFTP and enqueue them for processing.
   * Look for folder in the T4A IN folder matching the expected pattern and get
   * the list of files to be processed, enqueueing them in batches.
   * @param maxFileUploadsPerBatch Maximum number of files to be processed per batch.
   * @param processSummary Summary object to log the process details.
   */
  async process(
    maxFileUploadsPerBatch: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Get the list of T4A related directories from SFTP ordered by directory name.
    // Expected format starting with 4 digits (e.g., 2025, 2025-1, 2025-Some-Other-Text, etc).
    const t4aDirectories =
      await this.t4aIntegrationService.getResponseFilesFullPath(
        this.configService.t4aIntegration.folder,
        /^\d{4}[\w-]*/i,
        { itemType: SFTPItemType.Directory },
      );
    if (!t4aDirectories.length) {
      processSummary.info("No T4A directories found to process.");
      return;
    }
    processSummary.info(`Found T4A directories: ${t4aDirectories}.`);
    // For each directory, get the list of T4A files and queue them for processing.
    for (const directoryPath of t4aDirectories) {
      processSummary.info(`Processing T4A files in ${directoryPath}.`);
      const startListFiles = performance.now();
      const remoteFilePaths =
        await this.t4aIntegrationService.getResponseFilesFullPath(
          directoryPath,
          /\d{9}\.pdf/i,
          { itemType: SFTPItemType.File },
        );
      if (!remoteFilePaths.length) {
        processSummary.info(
          `No T4A files found in directory ${directoryPath}.`,
        );
        continue;
      }
      // The path is relative to the T4A IN folder to ensure the consumer
      // queue will look only into the configured folder, not allowing it
      // to receive files from other locations.
      const relativeFilePaths = remoteFilePaths.map((fullPath) =>
        fullPath.substring(this.configService.t4aIntegration.folder.length + 1),
      );
      const listFilesElapsedMs = performance.now() - startListFiles;
      processSummary.info(
        `Found ${relativeFilePaths.length} files in ${directoryPath}, in ${listFilesElapsedMs.toFixed(2)}ms.`,
      );
      // Create batches of files to be processed.
      const enqueueStart = performance.now();
      const referenceDate = new Date();
      // Queues in the format required by addBulk, splitted by max files per batch.
      const queues: { data: T4AUploadQueueInDTO }[] = [];
      for (
        let i = 0;
        i < relativeFilePaths.length;
        i += maxFileUploadsPerBatch
      ) {
        const filesBatch = relativeFilePaths.slice(
          i,
          i + maxFileUploadsPerBatch,
        );
        queues.push({
          data: new T4AUploadQueueInDTO(referenceDate, filesBatch),
        });
      }

      await this.t4aUploadQueue.addBulk(queues);
      const enqueueElapsedMs = performance.now() - enqueueStart;
      processSummary.info(
        `Time to queue files, ${enqueueElapsedMs.toFixed(2)}ms.`,
      );
    }
  }
}

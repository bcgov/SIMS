import { Processor } from "@nestjs/bull";
import { Job } from "bull";
import { T4AUploadQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { BaseQueue } from "..";
import { T4AUploadProcessingService } from "@sims/integrations/t4a";

/**
 * Uploads T4A files to student accounts.
 */
@Processor(QueueNames.T4AUpload)
export class T4AUploadProcessor extends BaseQueue<T4AUploadQueueInDTO> {
  constructor(
    logger: LoggerService,
    private readonly t4aUploadProcessingService: T4AUploadProcessingService,
  ) {
    super(logger);
  }

  /**
   * Queue for processing T4A file uploads batches.
   * Files are read from the SFTP and uploaded to student accounts
   * during a specific time of the year.
   * @param job Job information containing the files to be processed.
   * @param processSummary Summary object to log the process details.
   * @returns A message indicating the processing result and its duration.
   * The duration is useful for performance monitoring and can help identify
   * potential bottlenecks in the processing workflow.
   */
  protected async process(
    job: Job<T4AUploadQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info(
      `Processing T4A upload for ${job.data.files.length} file(s).`,
    );
    const startProcess = performance.now();
    await this.t4aUploadProcessingService.process(
      job.data.files,
      job.data.referenceDate,
      processSummary,
    );
    const endProcess = performance.now();
    return `T4A uploads processed in ${((endProcess - startProcess) / 1000).toFixed(2)}s.`;
  }
}

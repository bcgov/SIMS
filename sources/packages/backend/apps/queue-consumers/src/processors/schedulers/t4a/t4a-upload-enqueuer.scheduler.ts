import { Processor } from "@nestjs/bullmq";
import { T4AUploadEnqueuerQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";
import { T4AEnqueuerProcessingService } from "@sims/integrations/t4a";
import { DEFAULT_MAX_FILE_UPLOADS_PER_BATCH } from "@sims/integrations/constants";

/**
 * Scheduler to check the existence of T4A files for students on the SFTP,
 * downloads them and enqueue them for processing.
 */
@Processor(
  QueueNames.T4AUploadEnqueuer,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class T4AUploadEnqueuerScheduler extends BaseQueueProcessor<T4AUploadEnqueuerQueueInDTO> {
  constructor(
    private readonly t4aEnqueuerProcessingService: T4AEnqueuerProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process the job to check for T4A files and enqueue them for processing.
   * @param job The job containing the data for processing.
   * @param processSummary Summary object to log the process details.
   * @returns A message indicating the result of the process.
   */
  protected async processQueue(
    job: Job<T4AUploadEnqueuerQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const maxFileUploadsPerBatch =
      job.data.maxFileUploadsPerBatch ?? DEFAULT_MAX_FILE_UPLOADS_PER_BATCH;
    processSummary.info("Checking T4A files to be enqueued for processing.");
    processSummary.info(
      `Max file uploads per batch configured as ${maxFileUploadsPerBatch}.`,
    );
    await this.t4aEnqueuerProcessingService.process(
      maxFileUploadsPerBatch,
      processSummary,
    );
    return "T4A files process completed.";
  }
}

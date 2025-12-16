import { InjectQueue, Processor } from "@nestjs/bull";
import {
  QueueService,
  T4AUploadEnqueuerQueueInDTO,
} from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { T4AEnqueuerProcessingService } from "@sims/integrations/t4a";
import { DEFAULT_MAX_FILE_UPLOADS_PER_BATCH } from "@sims/integrations/constants";

/**
 * Scheduler to check the existence of T4A files for students on the SFTP,
 * downloads them and enqueue them for processing.
 */
@Processor(QueueNames.T4AUploadEnqueuer)
export class T4AUploadEnqueuerScheduler extends BaseScheduler<T4AUploadEnqueuerQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.T4AUploadEnqueuer)
    schedulerQueue: Queue<T4AUploadEnqueuerQueueInDTO>,
    queueService: QueueService,
    private readonly t4aEnqueuerProcessingService: T4AEnqueuerProcessingService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Process the job to check for T4A files and enqueue them for processing.
   * @param job The job containing the data for processing.
   * @param processSummary Summary object to log the process details.
   * @returns A message indicating the result of the process.
   */
  protected async process(
    job: Job<T4AUploadEnqueuerQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    processSummary.info("Checking T4A files to be enqueued for processing.");
    processSummary.info(
      `Max file uploads per batch configured as ${job.data.maxFileUploadsPerBatch}.`,
    );
    await this.t4aEnqueuerProcessingService.process(
      job.data.maxFileUploadsPerBatch,
      processSummary,
    );
    return "T4A files process completed.";
  }

  /**
   * Job configuration payload retrieval.
   * @returns Configuration payload for the scheduler job.
   */
  protected async payload(): Promise<T4AUploadEnqueuerQueueInDTO> {
    const queueConfig = await this.queueService.queueConfigurationDetails(
      this.schedulerQueue.name as QueueNames,
    );
    return {
      maxFileUploadsPerBatch:
        queueConfig.queueConfiguration.maxFileUploadsPerBatch ??
        DEFAULT_MAX_FILE_UPLOADS_PER_BATCH,
    };
  }
}

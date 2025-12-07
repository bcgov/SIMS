import { InjectQueue, Processor } from "@nestjs/bull";
import {
  QueueService,
  T4AUploadEnqueuerQueueInDTO,
} from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { T4AIntegrationProcessingService } from "@sims/integrations/t4a/t4a.processing.service";

const DEFAULT_MAX_FILE_UPLOADS_PER_BATCH = 100;

/**
 * Scheduler to check the existence of T4A files for students on the SFTP,
 * downloads them and makes them available for student download.
 */
@Processor(QueueNames.T4AUploadEnqueuer)
export class T4AUploadEnqueuerScheduler extends BaseScheduler<T4AUploadEnqueuerQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.T4AUploadEnqueuer)
    schedulerQueue: Queue<T4AUploadEnqueuerQueueInDTO>,
    queueService: QueueService,
    private readonly t4aIntegrationProcessingService: T4AIntegrationProcessingService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  protected async process(
    job: Job<T4AUploadEnqueuerQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    processSummary.info("Checking T4A files.");
    const maxFileUploadsPerBatch = await this.definedMaxFileUploadsPerBatch(
      job.data?.maxFileUploadsPerBatch,
    );
    processSummary.info(
      `Max file uploads per batch configured as ${maxFileUploadsPerBatch}.`,
    );
    try {
      await this.t4aIntegrationProcessingService.process(
        maxFileUploadsPerBatch,
        processSummary,
      );
      // } catch (error: unknown) {
      //   if (
      //     error instanceof CustomNamedError &&
      //     error.name === DATABASE_TRANSACTION_CANCELLATION
      //   ) {
      //     return "No batch was generated.";
      //   }
      //   throw error;
      return "T4A files check process completed.";
    } finally {
      processSummary.info("Checking T4A files process executed.");
    }
  }

  protected async payload(): Promise<T4AUploadEnqueuerQueueInDTO> {
    const queueConfig = await this.queueService.queueConfigurationDetails(
      this.schedulerQueue.name as QueueNames,
    );
    return {
      maxFileUploadsPerBatch:
        queueConfig.queueConfiguration.maxFileUploadsPerBatch,
    };
  }

  private async definedMaxFileUploadsPerBatch(
    jobMaxFileUploadsPerBatch?: number,
  ): Promise<number> {
    let maxFileUploadsPerBatch = DEFAULT_MAX_FILE_UPLOADS_PER_BATCH;
    if (jobMaxFileUploadsPerBatch) {
      // Use the value provided for the job if available, as a priority.
      maxFileUploadsPerBatch = jobMaxFileUploadsPerBatch;
    } else {
      // Otherwise, get the value from the queue configuration on DB, if available.
      const payload = await this.payload();
      if (payload.maxFileUploadsPerBatch) {
        maxFileUploadsPerBatch = payload.maxFileUploadsPerBatch;
      }
    }
    return maxFileUploadsPerBatch;
  }
}

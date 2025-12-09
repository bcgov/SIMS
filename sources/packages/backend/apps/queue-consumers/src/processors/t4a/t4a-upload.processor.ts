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

  protected async process(
    job: Job<T4AUploadQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info(
      `Processing T4A upload for files: ${job.data.remoteFiles}.`,
    );
    await this.t4aUploadProcessingService.process(
      job.data.remoteFiles,
      job.data.referenceDate,
      processSummary,
    );
    return "T4A uploads processed.";
  }
}

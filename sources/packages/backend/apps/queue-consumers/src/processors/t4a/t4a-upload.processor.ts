import { Processor } from "@nestjs/bull";
import { Job } from "bull";
import { T4AUploadQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { BaseQueue } from "..";

/**
 * Uploads T4A files to student accounts.
 */
@Processor(QueueNames.T4AUpload)
export class T4AUploadProcessor extends BaseQueue<T4AUploadQueueInDTO> {
  constructor(logger: LoggerService) {
    super(logger);
  }

  /**
   * Call Camunda to start the workflow.
   * @param job job details with assessment if and optional workflow name.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    job: Job<T4AUploadQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info(
      `Processing T4A upload for files: ${job.data.remoteFiles}.`,
    );
    // TODO: To be implemented.
    return "Workflow call executed with success.";
  }
}

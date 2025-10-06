import { InjectQueue, Processor } from "@nestjs/bull";
import { ECEProcessingService } from "@sims/integrations/institution-integration/ece-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";

@Processor(QueueNames.ECEProcessIntegration)
export class ECEProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ECEProcessIntegration)
    schedulerQueue: Queue<void>,
    private readonly eceFileService: ECEProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(ECEProcessIntegrationScheduler.name);
  }

  /**
   * Identifies all the applications that have an eligible COE request waiting
   * for a particular institution.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result with uploaded files, if any.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const uploadResults =
      await this.eceFileService.processECEFile(processSummary);
    if (!uploadResults.length) {
      return "No eligible COEs found.";
    }
    return uploadResults.map(
      (uploadResult) =>
        `Uploaded file ${uploadResult.generatedFile}, with ${uploadResult.uploadedRecords} record(s).`,
    );
  }
}

import { InjectQueue, Processor } from "@nestjs/bull";
import { IER12ProcessingService } from "@sims/integrations/institution-integration/ier12-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { IER12IntegrationQueueInDTO } from "./models/ier.model";

@Processor(QueueNames.IER12Integration)
export class IER12IntegrationScheduler extends BaseScheduler<IER12IntegrationQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.IER12Integration)
    schedulerQueue: Queue<IER12IntegrationQueueInDTO>,
    private readonly ierRequest: IER12ProcessingService,
    queueService: QueueService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Identifies all the applications which are in assessment
   * for a particular institution and generate the request file.
   * @param job The job containing the data for processing including modifiedSince and institutionCode.
   * @param processSummary process summary for logging.
   * @returns processing result log.
   */
  protected async process(
    job: Job<IER12IntegrationQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const uploadResults = await this.ierRequest.processIER12File(
      processSummary,
      job.data.modifiedSince,
      job.data.institutionCode,
    );
    if (!uploadResults.length) {
      return "No IER12 files were generated.";
    }
    return uploadResults.map(
      (uploadResult) =>
        `Uploaded file ${uploadResult.generatedFile}, with ${uploadResult.uploadedRecords} record(s).`,
    );
  }
}

import { InjectQueue, Processor } from "@nestjs/bull";
import { IER12ProcessingService } from "@sims/integrations/institution-integration/ier12-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { GeneratedDateQueueInDTO } from "./models/ier.model";

@Processor(QueueNames.IER12Integration)
export class IER12IntegrationScheduler extends BaseScheduler<GeneratedDateQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.IER12Integration)
    schedulerQueue: Queue<GeneratedDateQueueInDTO>,
    private readonly ierRequest: IER12ProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the applications which are in assessment
   * for a particular institution and generate the request file.
   * @param job has generatedDate Date in which the assessment for
   * particular institution is generated.
   * @param processSummary process summary for logging.
   * @returns processing result log.
   */
  protected async process(
    job: Job<GeneratedDateQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const uploadResults = await this.ierRequest.processIER12File(
      processSummary,
      job.data.generatedDate,
    );
    if (!uploadResults.length) {
      return "No IR12 files were generated.";
    }
    return uploadResults.map(
      (uploadResult) =>
        `Uploaded file ${uploadResult.generatedFile}, with ${uploadResult.uploadedRecords} record(s).`,
    );
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}

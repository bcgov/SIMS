import { InjectQueue, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.SINValidationProcessIntegration)
export class SINValidationProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @param _job job details.
   * @param processSummary process summary for logging.
   * @returns processing result log.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);
    const uploadResult =
      await this.sinValidationProcessingService.uploadSINValidationRequests(
        childProcessSummary,
      );
    processSummary.info("ESDC SIN validation request file sent.");
    return [
      `Generated file: ${uploadResult.generatedFile}`,
      `Uploaded records: ${uploadResult.uploadedRecords}`,
    ];
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

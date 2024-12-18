import { InjectQueue, Processor } from "@nestjs/bull";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.DisbursementReceiptsFileIntegration)
export class DisbursementReceiptsFileIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.DisbursementReceiptsFileIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all the disbursement receipt files from remote SFTP location.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.disbursementReceiptProcessingService.process(processSummary);
    return "Completed disbursement receipts integration.";
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

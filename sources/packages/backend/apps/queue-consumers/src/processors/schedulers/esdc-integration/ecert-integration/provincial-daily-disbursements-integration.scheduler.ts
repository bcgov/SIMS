import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { DisbursementReceiptRequestService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { DailyDisbursementReportQueueInDTO } from "../models/esdc.dto";

@Processor(QueueNames.FINProcessProvincialDailyDisbursementsIntegration)
export class FINProcessProvincialDailyDisbursementsIntegrationScheduler extends BaseScheduler<DailyDisbursementReportQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.FINProcessProvincialDailyDisbursementsIntegration)
    protected readonly schedulerQueue: Queue<DailyDisbursementReportQueueInDTO>,
    protected readonly queueService: QueueService,
    private readonly disbursementReceiptRequestService: DisbursementReceiptRequestService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Send provincial daily disbursement information to FIN.
   * @params job job details.
   * @returns Summary details of processing.
   */
  @Process()
  async processDisbursementReceipts(
    job: Job<DailyDisbursementReportQueueInDTO>,
  ): Promise<string> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    const batchRunDate = job.data.batchRunDate
      ? new Date(job.data.batchRunDate)
      : null;
    await this.cleanSchedulerQueueHistory();
    return this.disbursementReceiptRequestService.processProvincialDailyDisbursements(
      batchRunDate,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}

import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { DisbursementReceiptRequestService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { DailyDisbursementReport } from "../models/esdc.models";

@Processor(QueueNames.FINProcessProvincialDailyDisbursementsIntegration)
export class FINProcessProvincialDailyDisbursementsIntegrationScheduler extends BaseScheduler<DailyDisbursementReport> {
  constructor(
    @InjectQueue(QueueNames.FINProcessProvincialDailyDisbursementsIntegration)
    schedulerQueue: Queue<DailyDisbursementReport>,
    queueService: QueueService,
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
  async processFINProvincialDailyDisbursements(
    job: Job<DailyDisbursementReport>,
  ): Promise<QueueProcessSummaryResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing FIN provincial daily disbursement integration job ${job.id} of type ${job.name}.`,
    );
    const batchRunDate = job.data.batchRunDate
      ? new Date(job.data.batchRunDate)
      : null;
    await summary.info(
      await this.disbursementReceiptRequestService.processProvincialDailyDisbursements(
        batchRunDate,
      ),
    );
    await summary.info(
      `Completed FIN provincial daily disbursement integration job ${job.id} of type ${job.name}.`,
    );
    await this.cleanSchedulerQueueHistory();
    return summary.getSummary();
  }
}

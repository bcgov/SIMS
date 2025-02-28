import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CASInvoiceService } from "../../../services";
import { CASIntegrationQueueInDTO } from "../../../processors/schedulers/cas-integration/models/cas-integration.dto";

/**
 * Scheduler to send invoices to CAS.
 */
@Processor(QueueNames.CASSendInvoices)
export class CASSendInvoicesScheduler extends BaseScheduler<CASIntegrationQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.CASSendInvoices)
    schedulerQueue: Queue<CASIntegrationQueueInDTO>,
    queueService: QueueService,
    private readonly casInvoiceService: CASInvoiceService,
  ) {
    super(schedulerQueue, queueService);
  }

  protected async payload(): Promise<CASIntegrationQueueInDTO> {
    const queuePollingRecordsLimit =
      await this.queueService.getQueuePollingRecordLimit(
        this.schedulerQueue.name as QueueNames,
      );
    return { pollingRecordsLimit: queuePollingRecordsLimit };
  }

  /**
   * Scheduler to send invoices to CAS.
   * Checks for pending invoices on the approved batch and send them to CAS.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    job: Job<CASIntegrationQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Checking for pending invoices.");
    const pendingInvoices = await this.casInvoiceService.getPendingInvoices(
      job.data.pollingRecordsLimit,
    );
    if (pendingInvoices.length === 0) {
      processSummary.info("No pending invoices found.");
    } else {
      processSummary.info(
        `Executing ${pendingInvoices.length} pending invoice(s) sent to CAS.`,
      );
      const serviceProcessSummary = new ProcessSummary();
      processSummary.children(serviceProcessSummary);
      await this.casInvoiceService.sendInvoices(
        serviceProcessSummary,
        pendingInvoices,
      );
    }
    processSummary.info("CAS invoice(s) sent job completed.");
    return ["Process finalized with success."];
  }

  @InjectLogger()
  logger: LoggerService;
}

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

/**
 * Scheduler to send invoices to CAS.
 */
@Processor(QueueNames.CASSendInvoices)
export class CASSendInvoicesScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CASSendInvoices)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly casInvoiceService: CASInvoiceService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Scheduler to send invoices to CAS.
   * Checks for pending invoices on the approved batch and send them to CAS.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Checking for pending invoices.");
    const pendingInvoices = await this.casInvoiceService.getPendingInvoices();
    let invoicesUpdated = 0;
    if (!pendingInvoices.length) {
      processSummary.info("No pending invoices found.");
    }
    processSummary.info("Executing CAS send invoices.");
    const serviceProcessSummary = new ProcessSummary();
    processSummary.children(serviceProcessSummary);
    invoicesUpdated = await this.casInvoiceService.sendInvoices(
      serviceProcessSummary,
      pendingInvoices,
    );
    processSummary.info("CAS send invoices executed.");
    return ["Process finalized with success."];
  }

  @InjectLogger()
  logger: LoggerService;
}

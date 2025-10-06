import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CASInvoiceService } from "../../../services";
import { CASIntegrationQueueInDTO } from "./models/cas-integration.dto";

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
    this.logger.setContext(CASSendInvoicesScheduler.name);
  }

  protected async payload(): Promise<CASIntegrationQueueInDTO> {
    const pollingRecordsLimit =
      await this.queueService.getQueuePollingRecordLimit(
        this.schedulerQueue.name as QueueNames,
      );
    return { pollingRecordsLimit };
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
  ): Promise<string> {
    await this.casInvoiceService.sendInvoices(
      job.data.pollingRecordsLimit,
      processSummary,
    );
    return "Process finalized with success.";
  }
}

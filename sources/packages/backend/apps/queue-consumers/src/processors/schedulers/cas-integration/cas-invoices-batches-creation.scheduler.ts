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
import { CASInvoiceBatchService } from "../../../services";

/**
 * Scheduler to generate batches for CAS invoices for e-Cert receipts.
 */
@Processor(QueueNames.CASInvoicesBatchesCreation)
export class CASInvoicesBatchesCreationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CASSupplierIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly casInvoiceBatchService: CASInvoiceBatchService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Checks received e-Cert receipts with no invoice associated
   * and create invoice records to be sent to CAS.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    processSummary.info("Executing CAS invoices batches creation.");
    const createdBatch = await this.casInvoiceBatchService.createInvoiceBatch(
      processSummary,
    );
    processSummary.info("CAS invoices batches creation process executed.");
    if (!createdBatch) {
      return "No batch was generated.";
    }
    return [
      `Batch created: ${createdBatch.batchName}.`,
      `Invoices created: ${createdBatch.casInvoices.length}.`,
    ];
  }

  @InjectLogger()
  logger: LoggerService;
}

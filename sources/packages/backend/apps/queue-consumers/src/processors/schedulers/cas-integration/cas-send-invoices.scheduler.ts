import { Processor } from "@nestjs/bullmq";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";
import { CASInvoiceService } from "../../../services";
import { CASIntegrationQueueInDTO } from "./models/cas-integration.dto";

/**
 * Scheduler to send invoices to CAS.
 */
@Processor(QueueNames.CASSendInvoices, BaseQueueProcessor.defaultWorkerOptions)
export class CASSendInvoicesScheduler extends BaseQueueProcessor<CASIntegrationQueueInDTO> {
  constructor(
    private readonly casInvoiceService: CASInvoiceService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Scheduler to send invoices to CAS.
   * Checks for pending invoices on the approved batch and send them to CAS.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async processQueue(
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

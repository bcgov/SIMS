import { Process } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ECertCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../../utilities";

export abstract class ECertProcessIntegrationBaseScheduler extends BaseScheduler<void> {
  constructor(
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertCalculationProcess: ECertCalculationProcess,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @params job job details.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Process()
  async processECert(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Processing e-Cert.");
      processSummary.info(
        "Executing e-Cert calculations for all eligible disbursements.",
      );
      // e-Cert calculations.
      await this.eCertCalculationProcess.executeCalculations(processSummary);
      // e-Cert file generation.
      processSummary.info("Sending e-Cert file.");
      const uploadResult = await this.eCertFileHandler.generateECert();
      processSummary.info(`Generated file: ${uploadResult.generatedFile}`);
      processSummary.info(`Uploaded records: ${uploadResult.uploadedRecords}`);
      return getSuccessMessageWithAttentionCheck(
        "Process finalized with success.",
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}

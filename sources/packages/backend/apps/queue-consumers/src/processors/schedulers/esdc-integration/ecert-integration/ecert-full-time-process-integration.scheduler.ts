import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { FullTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../../utilities";

@Processor(QueueNames.FullTimeECertIntegration)
export class FullTimeECertProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fullTimeCalculationProcess: FullTimeCalculationProcess,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process full-time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @params job job details.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Process()
  async processFullTimeECert(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Processing full-time e-Cert.");
      processSummary.info(
        "Executing e-Cert calculations for all eligible disbursements.",
      );
      // e-Cert calculations.
      await this.fullTimeCalculationProcess.executeCalculations(processSummary);
      // e-Cert file generation.
      processSummary.info("Sending full-time e-Cert file.");
      const uploadResult = await this.eCertFileHandler.generateFullTimeECert();
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

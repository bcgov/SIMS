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
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    // e-Cert calculations.
    processSummary.info(
      "Executing e-Cert calculations for all eligible disbursements.",
    );
    await this.eCertCalculationProcess.executeCalculations(processSummary);
    // e-Cert file generation.
    processSummary.info("Sending e-Cert file.");
    const uploadResult = await this.eCertFileHandler.generateECert(
      processSummary,
    );
    const generatedFileMessage = `Generated file: ${uploadResult.generatedFile}`;
    const uploadedRecordsMessage = `Uploaded records: ${uploadResult.uploadedRecords}`;
    processSummary.info(generatedFileMessage);
    processSummary.info(uploadedRecordsMessage);
    return [generatedFileMessage, uploadedRecordsMessage];
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

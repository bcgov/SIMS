import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { SIMSToSFASProcessingService } from "@sims/integrations/sfas-integration";
import { SIMSToSFASService } from "@sims/integrations/services/sfas";
import { SIMS_TO_SFAS_BRIDGE_FILE_INITIAL_DATE } from "@sims/integrations/constants";

@Processor(QueueNames.SIMSToSFASIntegration)
export class SIMSToSFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SIMSToSFASIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly simsToSFASService: SIMSToSFASService,
    private readonly simsToSFASIntegrationProcessingService: SIMSToSFASProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Generate data file consisting of all student, application and restriction updates in SIMS since the previous file generation
   * until the start of the current job and send the data file to SFAS.
   * @param _job process job.
   * @param processSummary process summary for logging.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    // Set the bridge data extracted date as current date-time
    // before staring to process the bridge data.
    const bridgeDataExtractedDate = new Date();
    const latestBridgeFileReferenceDate =
      await this.simsToSFASService.getLatestBridgeFileLogDate();
    // If the bridge is being executed for the first time, set the modified since date to
    // a safe initial date.
    const modifiedSince =
      latestBridgeFileReferenceDate ?? SIMS_TO_SFAS_BRIDGE_FILE_INITIAL_DATE;
    processSummary.info(
      `Processing data since ${modifiedSince} until ${bridgeDataExtractedDate}.`,
    );
    const integrationProcessSummary = new ProcessSummary();
    processSummary.children(integrationProcessSummary);
    const {
      studentRecordsSent,
      applicationRecordsSent,
      restrictionRecordsSent,
      uploadedFileName,
    } = await this.simsToSFASIntegrationProcessingService.processSIMSUpdates(
      integrationProcessSummary,
      modifiedSince,
      bridgeDataExtractedDate,
    );
    return [
      "Process finalized with success.",
      `Student records sent: ${studentRecordsSent}.`,
      `Application records sent: ${applicationRecordsSent}.`,
      `Restriction records sent: ${restrictionRecordsSent}.`,
      `Uploaded file name: ${uploadedFileName}.`,
    ];
  }

  /**
   * Logger for SFAS integration scheduler.
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}

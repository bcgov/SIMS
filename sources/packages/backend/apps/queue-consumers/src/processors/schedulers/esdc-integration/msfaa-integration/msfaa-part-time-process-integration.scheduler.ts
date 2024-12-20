import { InjectQueue, Processor } from "@nestjs/bull";
import { MSFAARequestProcessingService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-request.processing.service";
import { MSFAA_PART_TIME_FILE_CODE } from "@sims/services/constants";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.PartTimeMSFAAProcessIntegration)
export class PartTimeMSFAAProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeMSFAAProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly msfaaRequestService: MSFAARequestProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * Create a fixed file for part time and send file
   * to the sftp server for processing.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns upload result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const result = await this.msfaaRequestService.processMSFAARequest(
      MSFAA_PART_TIME_FILE_CODE,
      OfferingIntensity.partTime,
      processSummary,
    );
    return [
      `Generated file: ${result.generatedFile}`,
      `Uploaded records: ${result.uploadedRecords}`,
    ];
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

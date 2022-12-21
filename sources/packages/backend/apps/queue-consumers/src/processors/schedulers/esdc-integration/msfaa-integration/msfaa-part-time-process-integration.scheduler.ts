import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { MSFAARequestService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAA_PART_TIME_FILE_CODE } from "@sims/services/constants";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { MSFAARequestResult } from "../models/msfaa-file-result.dto";

// todo: ann check the job.log
@Processor(QueueNames.PartTimeMSFAAProcessIntegration)
export class PartTimeMSFAAProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeMSFAAProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly msfaaRequestService: MSFAARequestService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * Create a fixed file for full time and send file
   * to the sftp server for processing
   * @params job job details.
   * @returns Processing result log.
   */
  @Process()
  async processMSFAA(job: Job<void>): Promise<MSFAARequestResult[]> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Sending MSFAA request File...");

    const uploadPartTimeResult = this.msfaaRequestService.processMSFAARequest(
      MSFAA_PART_TIME_FILE_CODE,
      OfferingIntensity.partTime,
    );
    // Wait for queries to finish.
    const [partTimeResponse] = await Promise.all([uploadPartTimeResult]);
    this.logger.log("MSFAA request file sent.");
    await this.cleanSchedulerQueueHistory();

    return [
      {
        offeringIntensity: OfferingIntensity.partTime,
        generatedFile: partTimeResponse.generatedFile,
        uploadedRecords: partTimeResponse.uploadedRecords,
      },
    ];
  }

  @InjectLogger()
  logger: LoggerService;
}

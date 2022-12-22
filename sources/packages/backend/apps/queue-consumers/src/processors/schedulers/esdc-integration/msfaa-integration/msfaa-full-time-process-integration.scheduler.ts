import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { MSFAARequestService } from "@sims/integrations/esdc-integration";
import { MSFAA_FULL_TIME_FILE_CODE } from "@sims/services/constants";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { MSFAARequestResult } from "../models/msfaa-file-result.dto";

@Processor(QueueNames.FullTimeMSFAAIntegration)
export class FullTimeMSFAAProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeMSFAAIntegration)
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
   * to the sftp server for processing.
   * @params job job details.
   * @returns Processing result log.
   */
  @Process()
  async processMSFAA(job: Job<void>): Promise<MSFAARequestResult[]> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Sending MSFAA request File...");
    const uploadFullTimeResult = this.msfaaRequestService.processMSFAARequest(
      MSFAA_FULL_TIME_FILE_CODE,
      OfferingIntensity.fullTime,
    );

    // Wait for queries to finish.
    const [fullTimeResponse] = await Promise.all([uploadFullTimeResult]);
    await summary.info("MSFAA request file sent.");
    await this.cleanSchedulerQueueHistory();

    return [
      {
        offeringIntensity: OfferingIntensity.fullTime,
        generatedFile: fullTimeResponse.generatedFile,
        uploadedRecords: fullTimeResponse.uploadedRecords,
      },
    ];
  }
}

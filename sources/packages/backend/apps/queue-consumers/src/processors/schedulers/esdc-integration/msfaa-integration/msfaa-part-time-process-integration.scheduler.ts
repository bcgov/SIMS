import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { MSFAARequestProcessingService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-request.processing.service";
import { MSFAA_PART_TIME_FILE_CODE } from "@sims/services/constants";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { MSFAARequestResult } from "../models/msfaa-file-result.models";
import { ProcessSummary } from "@sims/utilities/logger";

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

  processQueue(job: Job<void>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<void>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * Create a fixed file for part time and send file
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
      `Processing MSFAA Part-time integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Sending MSFAA request File...");
    const partTimeResponse = await this.msfaaRequestService.processMSFAARequest(
      MSFAA_PART_TIME_FILE_CODE,
      OfferingIntensity.partTime,
    );
    await summary.info("MSFAA request file sent.");
    await summary.info(
      `Completed MSFAA Part-time integration job ${job.id} of type ${job.name}.`,
    );
    return [
      {
        offeringIntensity: OfferingIntensity.partTime,
        generatedFile: partTimeResponse.generatedFile,
        uploadedRecords: partTimeResponse.uploadedRecords,
      },
    ];
  }
}

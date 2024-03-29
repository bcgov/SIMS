import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResult } from "../models/esdc.models";

@Processor(QueueNames.SINValidationProcessIntegration)
export class SINValidationProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @params job job details.
   * @returns processing result log.
   */
  @Process()
  async processSINValidation(job: Job<void>): Promise<ESDCFileResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing SIN validation integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Sending ESDC SIN validation request file.");
    const uploadResult =
      await this.sinValidationProcessingService.uploadSINValidationRequests();
    await summary.info("ESDC SIN validation request file sent.");
    await this.cleanSchedulerQueueHistory();
    await summary.info(
      `Completed SIN validation integration job ${job.id} of type ${job.name}.`,
    );
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }
}

import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResult } from "../models/esdc.dto";

@Processor(QueueNames.SINValidationProcessIntegration)
export class SINValidationProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
    private readonly systemUsersService: SystemUsersService,
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
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Sending ESDC SIN validation request file.");
    const auditUser = await this.systemUsersService.systemUser();
    const uploadResult =
      await this.sinValidationProcessingService.uploadSINValidationRequests(
        auditUser.id,
      );
    await summary.info("ESDC SIN validation request file sent.");
    await this.cleanSchedulerQueueHistory();
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }
}

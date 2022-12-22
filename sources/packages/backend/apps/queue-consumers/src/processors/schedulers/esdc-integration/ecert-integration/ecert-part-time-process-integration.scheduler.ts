import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResult } from "../models/esdc.dto";

@Processor(QueueNames.PartTimeECertIntegration)
export class PartTimeECertProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @params job job details.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Process()
  async processPartTimeECert(job: Job<void>): Promise<ESDCFileResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Sending Part-Time E-Cert File...");
    const uploadPartTimeResult =
      await this.eCertFileHandler.generatePartTimeECert();
    await summary.info("E-Cert Part-Time file sent.");
    await this.cleanSchedulerQueueHistory();
    return {
      generatedFile: uploadPartTimeResult.generatedFile,
      uploadedRecords: uploadPartTimeResult.uploadedRecords,
    };
  }
}

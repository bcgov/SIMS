import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-file-handler";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResult } from "../models/esdc.dto";

// todo: ann check the job.log
@Processor(QueueNames.FullTimeECertIntegration)
export class FullTimeECertProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process Full-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @params job job details.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Process()
  async processFullTimeECert(job: Job<void>): Promise<ESDCFileResult> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Sending Full-Time E-Cert File...");
    const uploadFullTimeResult =
      await this.eCertFileHandler.generateFullTimeECert();
    this.logger.log("E-Cert Full-Time file sent.");
    await this.cleanSchedulerQueueHistory();
    return {
      generatedFile: uploadFullTimeResult.generatedFile,
      uploadedRecords: uploadFullTimeResult.uploadedRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}

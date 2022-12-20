import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-file-handler";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResultQueueOutDTO } from "../models/esdc.dto";

// todo: ann check the job.log
@Processor(QueueNames.PartTimeECertIntegration)
export class PartTimeECertProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeECertIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
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
  async processPartTimeECert(
    job: Job<void>,
  ): Promise<ESDCFileResultQueueOutDTO> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Sending Part-Time E-Cert File...");
    const uploadPartTimeResult =
      await this.eCertFileHandler.generatePartTimeECert();
    this.logger.log("E-Cert Part-Time file sent.");
    await this.cleanSchedulerQueueHistory();
    return {
      generatedFile: uploadPartTimeResult.generatedFile,
      uploadedRecords: uploadPartTimeResult.uploadedRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}

import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { CRAPersonalVerificationService } from "@sims/integrations/cra-integration/cra-personal-verification.service";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CRAValidationResultQueueOutDTO } from "./models/cra-validation-result.dto";

@Processor(QueueNames.CRAProcessIntegration)
export default class CRAProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CRAProcessIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
    private readonly cra: CRAPersonalVerificationService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the student applications that have a pending
   * income verification and generate the request file to be
   * processed by CRA.
   * @params job job details.
   * @returns Processing result log.
   */
  @Process()
  async processIncomeVerification(
    job: Job<void>,
  ): Promise<CRAValidationResultQueueOutDTO> {
    const queueCleanUpPeriod = await this.queueService.getQueueCleanUpPeriod(
      this.schedulerQueue.name as QueueNames,
    );
    this.logger.log(
      `Processing IER integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing income validation...");
    const uploadResult = await this.cra.createIncomeVerificationRequest();
    this.logger.log("Income validation executed.");
    this.schedulerQueue.clean(queueCleanUpPeriod, "completed");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}

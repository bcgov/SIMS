import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { CRAIncomeVerificationProcessingService } from "@sims/integrations/cra-integration/cra-income-verification.processing.service";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CRAValidationResult } from "./models/cra-validation-result.dto";

@Processor(QueueNames.CRAProcessIntegration)
export class CRAProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CRAProcessIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly cra: CRAIncomeVerificationProcessingService,
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
  ): Promise<CRAValidationResult> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing income validation...");
    const uploadResult = await this.cra.createIncomeVerificationRequest();
    this.logger.log("Income validation executed.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}

import { InjectQueue, Processor } from "@nestjs/bull";
import { CRAIncomeVerificationProcessingService } from "@sims/integrations/cra-integration/cra-income-verification.processing.service";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";

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
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Executing income validation.");
    const uploadResult = await this.cra.createIncomeVerificationRequest();
    processSummary.info("Income validation executed.");
    return [
      `Generated file: ${uploadResult.generatedFile}`,
      `Uploaded records: ${uploadResult.uploadedRecords}`,
    ];
  }

  @InjectLogger()
  logger: LoggerService;
}

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

@Processor(QueueNames.CRAResponseIntegration)
export class CRAResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CRAResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly cra: CRAIncomeVerificationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all files from CRA Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const results = await this.cra.processResponses();
    processSummary.info(`CRA response files processed: ${results.length}`);
    const responsesSummaries = results.map((result) => {
      const responseSummary = new ProcessSummary();
      result.processSummary.forEach((info) => responseSummary.info(info));
      result.errorsSummary.forEach((error) => responseSummary.error(error));
      return responseSummary;
    });
    processSummary.children(...responsesSummaries);
    return "Processed CRA response files.";
  }

  @InjectLogger()
  logger: LoggerService;
}

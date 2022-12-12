import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { CRAPersonalVerificationService } from "@sims/integrations/cra-integration/cra-personal-verification.service";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { ProcessResponseQueueOutDTO } from "./models/process-response.dto";

@Processor(QueueNames.CRAResponseIntegration)
export class CRAResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CRAResponseIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
    private readonly cra: CRAPersonalVerificationService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all files from CRA Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processResponses(
    job: Job<void>,
  ): Promise<ProcessResponseQueueOutDTO[]> {
    const queueCleanUpPeriod = await this.queueService.getQueueCleanUpPeriod(
      this.schedulerQueue.name as QueueNames,
    );
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    const results = await this.cra.processResponses();
    await this.schedulerQueue.clean(queueCleanUpPeriod, "completed");
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}

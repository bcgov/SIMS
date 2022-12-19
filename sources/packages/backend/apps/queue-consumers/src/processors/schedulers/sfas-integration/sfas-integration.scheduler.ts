import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { SFASProcessingResultQueueOutDTO } from "./models/sfas-integration.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { SFASIntegrationProcessingService } from "@sims/integrations/sfas-integration";

/**
 * Process all SFAS integration files from the SFTP location.
 */
@Processor(QueueNames.SFASIntegration)
export class SFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SFASIntegration)
    protected readonly schedulerQueue: Queue<void>,
    private readonly sfasIntegrationProcessingService: SFASIntegrationProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all SFAS integration files from the SFTP
   * and update the database with processed records.
   * @param job SFAS integration job.
   * @returns processing result.
   */
  @Process()
  async processSFASIntegrationFiles(
    job: Job<void>,
  ): Promise<SFASProcessingResultQueueOutDTO[]> {
    await job.log("Processing SFAS integration files...");
    const processingResults =
      await this.sfasIntegrationProcessingService.process();
    await job.log("Completed processing SFAS integration files.");
    await this.cleanSchedulerQueueHistory();
    return processingResults.map((result) => ({
      summary: result.summary,
      success: result.success,
    }));
  }
}

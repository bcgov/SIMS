import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { SFASProcessingResult } from "./models/sfas-integration.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { SFASIntegrationProcessingService } from "@sims/integrations/sfas-integration";
import { QueueProcessSummary } from "../../models/processors.models";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Process all SFAS integration files from the SFTP location.
 */
@Processor(QueueNames.SFASIntegration)
export class SFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SFASIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sfasIntegrationProcessingService: SFASIntegrationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  processQueue(job: Job<void>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<void>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
  ): Promise<SFASProcessingResult[]> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info("Processing SFAS integration files...");
    const processingResults =
      await this.sfasIntegrationProcessingService.process();
    await summary.info("Completed processing SFAS integration files.");
    return processingResults.map((result) => ({
      summary: result.summary,
      success: result.success,
    }));
  }
}

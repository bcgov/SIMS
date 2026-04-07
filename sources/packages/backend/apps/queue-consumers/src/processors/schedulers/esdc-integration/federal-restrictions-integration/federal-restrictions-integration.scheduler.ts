import { InjectQueue, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { DataSource } from "typeorm";

@Processor(QueueNames.FederalRestrictionsIntegration)
export class FederalRestrictionsIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FederalRestrictionsIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fedRestrictionProcessingService: FedRestrictionProcessingService,
    private readonly dataSource: DataSource,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Federal restriction import.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    return this.dataSource.transaction(async (entityManager) => {
      await job.log("Acquiring lock for execution.");
      // Ensure only one instance of the scheduler is processing at a time by acquiring a lock on the queue.
      // Even if the process is considered stalled by the queue processor, the lock will prevent another
      // instance of the scheduler from processing until the lock is released.
      await this.acquireLock(entityManager);
      await job.log(
        "Lock acquired. Starting federal restrictions import process.",
      );
      const result = await this.fedRestrictionProcessingService.process(
        processSummary,
        entityManager,
      );
      if (result.filesFound.length) {
        return [
          `Federal restrictions import process finished.`,
          `Processed file: ${result.processedFileName}`,
          `Files found: ${result.filesFound.join(", ")}.`,
        ];
      }
      return "No files found to be processed.";
    });
  }
}

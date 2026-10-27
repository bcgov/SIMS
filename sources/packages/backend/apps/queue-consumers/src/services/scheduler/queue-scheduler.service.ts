import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QueueService } from "@sims/services/queue";
import { BULL_MQ_MIGRATED_QUEUE_NAMES, JOB_SUFFIX } from "@sims/utilities";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class QueueSchedulerService implements OnApplicationBootstrap {
  constructor(
    private readonly queueService: QueueService,
    private readonly moduleRef: ModuleRef,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Configure and upsert job schedulers for all queues marked as schedulers.
   */
  async onApplicationBootstrap(): Promise<void> {
    const queues = await this.queueService.getAllQueueConfigurations();
    const schedulerQueueConfigurations = queues.filter(
      (queue) =>
        BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queue.queueName) &&
        queue.isScheduler,
    );
    if (!schedulerQueueConfigurations.length) {
      this.logger.log(`No scheduler queues found.`);
      return;
    }
    for (const schedulerQueueConfig of schedulerQueueConfigurations) {
      const queueName = schedulerQueueConfig.queueName;
      const queueToken = getQueueToken(queueName);
      const schedulerQueue = this.moduleRef.get<Queue>(queueToken, {
        strict: false,
      });
      if (!schedulerQueueConfig.isActive) {
        await schedulerQueue.obliterate({ force: true });
        this.logger.log(`Obliterate inactive queue ${queueName} is complete.`);
        // Skip inactive queues after obliterating the queue.
        continue;
      }
      try {
        await schedulerQueue.upsertJobScheduler(
          `scheduler-${queueName}`,
          schedulerQueueConfig.queueConfiguration.repeatOptions,
          {
            name: `${queueName}${JOB_SUFFIX}`,
            data: schedulerQueueConfig.queueConfiguration.jobData,
          },
        );
        this.logger.log(
          `Upsert job scheduler for queue ${queueName} is complete.`,
        );
      } catch (error: unknown) {
        this.logger.error(
          `Unexpected error occurred while trying to upsert job scheduler for queue ${queueName}.`,
          error,
        );
        throw error;
      }
    }
  }
}

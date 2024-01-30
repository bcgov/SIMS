import { LoggerService, OnApplicationBootstrap } from "@nestjs/common";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger } from "@sims/utilities/logger";
import { CronRepeatOptions, Queue } from "bull";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  constructor(
    protected schedulerQueue: Queue<T>,
    protected queueService: QueueService,
  ) {}

  /**
   * Clean the queue scheduler history.
   */
  protected async cleanSchedulerQueueHistory(): Promise<void> {
    try {
      const queueCleanUpPeriod = await this.queueService.getQueueCleanUpPeriod(
        this.schedulerQueue.name as QueueNames,
      );
      await this.schedulerQueue.clean(queueCleanUpPeriod, "completed");
    } catch (error: unknown) {
      // Fail silently.
      this.logger.error(error);
    }
  }

  /**
   * Get queue cron configurations.
   */
  private async queueCronConfiguration(): Promise<CronRepeatOptions> {
    const queueConfig = await this.queueService.getQueueConfiguration(
      this.schedulerQueue.name as QueueNames,
    );
    return queueConfig.repeat as CronRepeatOptions;
  }

  /**
   * Payload data which could be overridden if required by the implementing subclass.
   */
  protected async payload(): Promise<T> {
    return undefined;
  }

  /**
   * Once all modules have been initialized it will check, if there is
   * any old cron job delete it and add the new job to the queue.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.deleteOldRepeatableJobs();
    // Add the cron to the queue.
    //await this.schedulerQueue.add(await this.payload());
  }

  /**
   * Check if there is any old cron job  (i.e whenever there is a
   * change in cron option, then a new job is created the old job
   * will be still there in the queue) and delete it and add the
   * new job to the queue.
   * Note: If there is an old retrying job, it won't be deleted,
   * as "getRepeatableJobs" will not fetch retrying jobs.
   */
  private async deleteOldRepeatableJobs(): Promise<void> {
    const getAllRepeatableJobs = await this.schedulerQueue.getRepeatableJobs();
    const cronRepeatOption = await this.queueCronConfiguration();
    getAllRepeatableJobs.forEach((job) => {
      if (job.cron !== cronRepeatOption.cron) {
        this.schedulerQueue.removeRepeatableByKey(job.key);
      }
    });
  }

  @InjectLogger()
  logger: LoggerService;
}

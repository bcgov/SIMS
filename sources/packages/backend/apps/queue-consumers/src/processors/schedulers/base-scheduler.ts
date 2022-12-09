import { OnApplicationBootstrap } from "@nestjs/common";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import Bull, { CronRepeatOptions, Queue } from "bull";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  constructor(
    protected schedulerQueue: Queue<T>,
    protected queueService: QueueService,
  ) {}

  async queueConfiguration(): Promise<Bull.JobOptions> {
    return this.queueService.getQueueConfiguration(
      this.schedulerQueue.name as QueueNames,
    );
  }

  /**
   * Once all modules have been initialized it will check, if there is
   * any old cron job delete it and add the new job to the queue.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.deleteOldRepeatableJobs();
    // Add the cron to the queue.
    const queueConfig = await this.queueConfiguration();
    await this.schedulerQueue.add(undefined, queueConfig);
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
    const queueConfig = await this.queueConfiguration();
    const cronRepeatOption = queueConfig.repeat as CronRepeatOptions;
    getAllRepeatableJobs.forEach((job) => {
      if (job.cron !== cronRepeatOption.cron) {
        this.schedulerQueue.removeRepeatableByKey(job.key);
      }
    });
  }
}

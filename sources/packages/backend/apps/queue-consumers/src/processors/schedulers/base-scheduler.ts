import { OnApplicationBootstrap } from "@nestjs/common";
import Bull, { CronRepeatOptions, Queue } from "bull";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  /**
   * Payload data which could be overridden if required by the implementing subclass.
   */
  protected get payload(): T {
    return undefined;
  }

  constructor(protected schedulerQueue: Queue<T>) {}

  /**
   * Queue configuration which will be assigned by the implementing subclass.
   */
  protected abstract queueConfiguration: Bull.JobOptions;

  /**
   * Once all modules have been initialized it will check, if there is
   * any old cron job delete it and add the new job to the queue.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.deleteOldRepeatableJobs();
    // Add the cron to the queue.
    await this.schedulerQueue.add(this.payload, this.queueConfiguration);
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
    const cronRepeatOption = this.queueConfiguration
      .repeat as CronRepeatOptions;
    getAllRepeatableJobs.forEach((job) => {
      if (job.cron !== cronRepeatOption.cron) {
        this.schedulerQueue.removeRepeatableByKey(job.key);
      }
    });
  }
}

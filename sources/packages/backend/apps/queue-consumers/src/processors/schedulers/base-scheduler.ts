import { OnApplicationBootstrap } from "@nestjs/common";
import Bull, { CronRepeatOptions, Queue } from "bull";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  abstract initializeScheduler(): void;
  abstract cronOptions: Bull.JobOptions;
  abstract schedulerQueue: Queue<T>;

  /**
   * Once all modules have been initialized
   * it will check, if there is any old cron job
   * delete it and add the new job to the
   * queue.
   */
  async onApplicationBootstrap() {
    await this.deleteOldRepeatableJobs();
    this.initializeScheduler();
  }

  /**
   * Check if there is any old cron job  (i.e whenever there is a
   * change in cron option, then a new job is created the old job
   * will be still there in the queue) and delete it and add the
   * new job to the queue.
   * Note: If there is an old retrying job, it won't be deleted,
   * as "getRepeatableJobs" will not fetch retrying jobs.
   */
  async deleteOldRepeatableJobs(): Promise<void> {
    const getAllRepeatableJobs = await this.schedulerQueue.getRepeatableJobs();
    const cronRepeatOption = this.cronOptions.repeat as CronRepeatOptions;
    getAllRepeatableJobs.forEach((job) => {
      if (
        job.id === this.cronOptions.jobId &&
        job.cron !== cronRepeatOption.cron
      ) {
        this.schedulerQueue.removeRepeatableByKey(job.key);
      }
    });
  }
}

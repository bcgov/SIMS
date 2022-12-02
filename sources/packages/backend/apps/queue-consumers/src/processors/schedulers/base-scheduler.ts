import { OnApplicationBootstrap } from "@nestjs/common";
import { QUEUE_RETRY_DEFAULT_CONFIG } from "@sims/services/constants";
import { QueueNames } from "@sims/services/queue";
import { PST_TIMEZONE } from "@sims/utilities";
import Bull, { CronRepeatOptions, Queue } from "bull";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  // When overridden in a derived class, it hold the repeatable job id.
  protected abstract repeatableJobId: QueueNames;
  // When overridden in a derived class, it hold the repeatable cron expression.
  protected abstract cronExpression: string;

  constructor(protected schedulerQueue: Queue<T>) {}

  protected get cronOptions(): Bull.JobOptions {
    return {
      ...QUEUE_RETRY_DEFAULT_CONFIG,
      jobId: this.repeatableJobId,
      repeat: {
        cron: this.cronExpression,
        tz: PST_TIMEZONE,
      } as CronRepeatOptions,
    };
  }

  /**
   * Once all modules have been initialized
   * it will check, if there is any old cron job
   * delete it and add the new job to the
   * queue.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.deleteOldRepeatableJobs();
    // Add the cron to the queue.
    await this.schedulerQueue.add(undefined, this.cronOptions);
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

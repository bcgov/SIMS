import { LoggerService, OnApplicationBootstrap } from "@nestjs/common";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { ConfigService } from "@sims/utilities/config";
import { InjectLogger } from "@sims/utilities/logger";
import { CronRepeatOptions, Queue } from "bull";
import { v4 as uuid } from "uuid";
import * as cronParser from "cron-parser";

export abstract class BaseScheduler<T> implements OnApplicationBootstrap {
  constructor(
    protected schedulerQueue: Queue<T>,
    protected queueService: QueueService,
  ) {}

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
    // Stops this scheduler from running if the isActive status is false
    // and it falls into the scheduler-queues category (cron returns a value).
    const queueConfigurations =
      await this.queueService.queueConfigurationModel();
    const inactiveQueue = queueConfigurations.find(
      (queue) =>
        queue.name === this.schedulerQueue.name &&
        !queue.isActive &&
        queue.isScheduler,
    );
    if (inactiveQueue) {
      await this.schedulerQueue.obliterate({ force: true });
      return;
    }
    // TODO: Allow only part time schedulers based on config is temporary
    // and will be removed during fulltime release.
    // As the logic is temporary solution and must be easily reverted,
    // config service is not injected as extending it here (base class)
    // will cause it to be added in all the multiple subclasses extending from it.
    const isFulltimeAllowed = new ConfigService().isFulltimeAllowed;
    // Allow Fulltime Schedulers only if isFulltimeAllowed is true
    if (
      !isFulltimeAllowed &&
      [
        QueueNames.FullTimeMSFAAIntegration,
        QueueNames.FullTimeECertIntegration,
        QueueNames.FullTimeFeedbackIntegration,
        QueueNames.FullTimeMSFAAProcessResponseIntegration,
        QueueNames.IER12Integration,
        QueueNames.ECEProcessIntegration,
        QueueNames.ECEProcessResponseIntegration,
      ].includes(this.schedulerQueue.name as QueueNames)
    ) {
      await this.schedulerQueue.obliterate({ force: true });
      return;
    }
    // Acquires a lock to avoid concurrent issues while checking the queues on Redis.
    // This prevents concurrency between queue-consumers instances and also between the
    // schedulers bootstrap executions (when all bootstrap methods were executed at the same time
    // it caused issues with the ioredis connection).
    await this.queueService.acquireGlobalQueueLock(async () => {
      this.logger.log(
        `Starting verification to ensure the next delayed job is created for queue ${this.schedulerQueue.name}.`,
      );
      try {
        this.logger.log(`Check if current job state is paused.`);
        // Check if the job is paused to avoid creating new delayed jobs.
        const isPaused = await this.schedulerQueue.isPaused();
        if (isPaused) {
          return;
        }
        await this.ensureNextDelayedJobCreation();
      } catch (error: unknown) {
        this.logger.error(`Error while ensuring next delayed job.`, error);
        throw error;
      }
    });
  }

  /**
   * Ensures a scheduled job will have a delayed job created with the
   * next expected scheduled time based on the configured cron expression.
   */
  private async ensureNextDelayedJobCreation(): Promise<void> {
    this.logger.log(`Getting list of delayed jobs.`);
    const delayedJobs = await this.schedulerQueue.getDelayed();
    const expectedJobMilliseconds =
      await this.getNexSchedulerExecutionMilliseconds();
    // Check if there is a delayed job with the expected scheduled time.
    const expectedDelayedJob = delayedJobs.find((delayedJob) => {
      const delayedJobMilliseconds =
        delayedJob.opts.delay + delayedJob.timestamp;
      return expectedJobMilliseconds === delayedJobMilliseconds;
    });
    // If the only delayed job is the expected one, no further verifications are needed.
    if (expectedDelayedJob && delayedJobs.length === 1) {
      this.logger.log(`Delayed job was already created as expected.`);
      return;
    }
    // Remove any non expected delayed job.
    for (const delayedJob of delayedJobs) {
      if (!expectedDelayedJob || delayedJob !== expectedDelayedJob) {
        this.logger.log(`Removing job ${delayedJob.id}.`);
        await delayedJob.remove();
      }
    }
    // The expected delayed job was found and any
    // extra delayed jobs were removed.
    if (expectedDelayedJob) {
      return;
    }
    // Creating a unique job ID ensures that the delayed jobs
    // will be created even if they were already promoted.
    const uniqueJobId = `${this.schedulerQueue.name}:${uuid()}`;
    this.logger.log(`Creating new delayed job using unique id ${uniqueJobId}.`);
    await this.schedulerQueue.add(await this.payload(), {
      jobId: uniqueJobId,
    });
    this.logger.log(`New delayed job id ${uniqueJobId} was created.`);
  }

  /**
   * Gets the next scheduled date milliseconds for the given cron expression.
   * @param cron cron expression string.
   * @returns the next date the scheduler will be executed.
   */
  async getNexSchedulerExecutionMilliseconds(): Promise<number> {
    const repeatOptions = await this.queueCronConfiguration();
    const result = cronParser.parseExpression(repeatOptions.cron, {
      utc: true,
    });
    return result.next().getTime();
  }

  @InjectLogger()
  logger: LoggerService;
}

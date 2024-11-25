import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueueConfiguration } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import Bull, { AdvancedSettings } from "bull";
import { DataSource, Repository } from "typeorm";
import { QueueModel } from "./model/queue.model";

@Injectable()
export class QueueService {
  private queueConfiguration: QueueConfiguration[] = undefined;
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(QueueConfiguration)
    private queueConfigurationRepo: Repository<QueueConfiguration>,
  ) {}

  /**
   * Get all queue name and configurations.
   * @returns queue configuration.
   */
  async getAllQueueConfigurations(): Promise<QueueConfiguration[]> {
    if (this.queueConfiguration) {
      return this.queueConfiguration;
    }
    this.queueConfiguration = await this.queueConfigurationRepo.find({
      select: {
        queueName: true,
        queueConfiguration: true as unknown,
        queueSetting: true as unknown,
        isActive: true,
      },
    });
    return this.queueConfiguration;
  }

  /**
   * Get queue configuration details for the requested queue name.
   * @param queueName queue name
   * @returns queue configuration.
   */
  private async queueConfigurationDetails(
    queueName: QueueNames,
  ): Promise<QueueConfiguration> {
    const queues = await this.getAllQueueConfigurations();
    return queues.find((queue) => queue.queueName === queueName);
  }

  /**
   * Queue details transformation for bull board configuration
   * @returns queue configuration.
   */
  async queueConfigurationModel(): Promise<QueueModel[]> {
    const queues = await this.getAllQueueConfigurations();
    return queues.map((queue) => ({
      name: queue.queueName,
      dashboardReadonly: queue.queueConfiguration.dashboardReadonly,
      isActive: queue.isActive,
      isScheduler: !!queue.queueConfiguration.cron,
    }));
  }

  /**
   * Get queue configuration for the requested queue name.
   * @param queueName queue name.
   * @returns queue configuration.
   */
  async getQueueConfiguration(queueName: QueueNames): Promise<Bull.JobOptions> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    const config = {} as Bull.JobOptions;
    const queueConfiguration = queueConfig.queueConfiguration;
    if (queueConfiguration.retry && queueConfiguration.retryInterval) {
      config.attempts = queueConfiguration.retry;
      config.backoff = queueConfiguration.retryInterval;
    }
    if (queueConfig.queueConfiguration.cron) {
      config.repeat = {
        cron: queueConfig.queueConfiguration.cron,
      };
    }
    return config;
  }

  /**
   * Get the advanced queue settings.
   * @param queueName queue name.
   * @returns queue advanced settings.
   */
  async getQueueSetting(queueName: QueueNames): Promise<AdvancedSettings> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    return queueConfig.queueSetting;
  }

  /**
   * Get queue clean up period.
   * @param queueName queue name
   * @returns queue clean up period.
   */
  async getQueueCleanUpPeriod(
    queueName: QueueNames,
  ): Promise<number | undefined> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    return queueConfig.queueConfiguration.cleanUpPeriod;
  }

  /**
   * Get queue polling record limit.
   * @param queueName queue name
   * @returns queue polling record limit.
   */
  async getQueuePollingRecordLimit(
    queueName: QueueNames,
  ): Promise<number | undefined> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    return queueConfig.queueConfiguration.pollingRecordLimit;
  }

  /**
   * Gets the amount of hours for the assessment retry.
   * @param queueName queue name
   * @returns amount of hours for the assessment retry.
   */
  async getAmountHoursAssessmentRetry(
    queueName: QueueNames,
  ): Promise<number | undefined> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    return queueConfig.queueConfiguration.amountHoursAssessmentRetry;
  }

  /**
   * Acquires a database lock that can be used for any task that requires
   * a single process to be executed exclusively at a time, even in different
   * queue-consumers instances.
   * @param callback method to be executed inside the lock.
   */
  async acquireGlobalQueueLock(callback: () => Promise<void>): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      // Selects the first record to be used as a lock.
      await entityManager.getRepository(QueueConfiguration).find({
        select: {
          id: true,
        },
        lock: { mode: "pessimistic_write" },
        order: { id: "ASC" },
        take: 1,
      });
      await callback();
    });
  }
}

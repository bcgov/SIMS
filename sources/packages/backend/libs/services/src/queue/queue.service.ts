import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueueConfiguration } from "@sims/sims-db";
import { QueueNames, schedulerQueueNames } from "@sims/utilities";
import Bull from "bull";
import { Repository } from "typeorm";
import { QueueModel } from "./model/queue.model";

@Injectable()
export class QueueService {
  private queueConfiguration: QueueConfiguration[] = undefined;
  constructor(
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
        isActive: true,
      },
    });
    return this.queueConfiguration;
  }

  /**
   * Get all inactive queue names.
   * @returns queue names.
   */
  async getInactiveQueueConfigurations(): Promise<QueueNames[]> {
    const queues = await this.getAllQueueConfigurations();
    return queues
      .filter((queue) => queue.isActive === false)
      .map((queue) => queue.queueName);
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
    }));
  }

  /**
   * Get queue configuration for the requested queue name.
   * @param queueName queue name
   * @returns queue configuration.
   */
  async getQueueConfiguration(queueName: QueueNames): Promise<Bull.JobOptions> {
    const queueConfig = await this.queueConfigurationDetails(queueName);
    // If a queue configuration record is inactive due to its false in_active flag
    // and the queue is a scheduler queue, then it will return undefined.
    if (
      !queueConfig.isActive &&
      schedulerQueueNames.includes(queueConfig.queueName)
    ) {
      return;
    }
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
}

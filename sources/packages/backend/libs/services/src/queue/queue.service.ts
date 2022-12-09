import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueueConfiguration } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
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
      },
    });
    return this.queueConfiguration;
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
    }));
  }

  /**
   * Get queue configuration
   * @param name queue name
   * @returns queue configuration.
   */
  async getQueueConfiguration(name: QueueNames): Promise<Bull.JobOptions> {
    const queues = await this.getAllQueueConfigurations();
    const [queueConfig] = queues.filter((queue) => queue.queueName === name);
    return {
      attempts: queueConfig.queueConfiguration.retry,
      backoff: queueConfig.queueConfiguration.retryInterval,
      repeat: {
        cron: queueConfig.queueConfiguration.cron,
      },
    };
  }

  /**
   * Get queue clean up period.
   * @param name queue name
   * @returns queue clean up period.
   */
  async getQueueCleanUpPeriod(name: QueueNames): Promise<number | undefined> {
    const queues = await this.getAllQueueConfigurations();
    const [queueConfig] = queues.filter((queue) => queue.queueName === name);
    return queueConfig.queueConfiguration.cleanUpPeriod;
  }
}

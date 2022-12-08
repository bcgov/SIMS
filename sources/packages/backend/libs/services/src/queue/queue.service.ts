import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueueConfiguration } from "@sims/sims-db";
import { QueueConfigurationDetails } from "@sims/sims-db/entities/queue-configuration.type";
import { QueueNames } from "@sims/utilities";
import Bull from "bull";
import { FindOptionsSelect, Repository } from "typeorm";
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
        queueConfiguration:
          true as FindOptionsSelect<QueueConfigurationDetails>,
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
   * todo: ann promise any
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
}

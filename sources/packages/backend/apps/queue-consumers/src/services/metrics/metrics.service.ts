import { getQueueToken } from "@nestjs/bull";
import { Injectable, LoggerService } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { QueueService } from "@sims/services/queue";
import { processInParallel } from "@sims/utilities";
import { InjectLogger } from "@sims/utilities/logger";
import {
  DEFAULT_METRICS_APP_LABEL,
  DEFAULT_JOBS_COUNTS_GAUGE,
  DEFAULT_JOBS_EVENTS_COUNTER,
  QueuesMetricsEvents,
  MonitoredQueue,
} from "./metrics.models";
import { Queue } from "bull";
import { register, collectDefaultMetrics } from "prom-client";

@Injectable()
export class MetricsService {
  /**
   * List of queues to be monitored. This list is loaded once
   * and is expected to change only if the application restarts.
   */
  private monitoredQueueProviders: MonitoredQueue[];

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Set global metrics configurations.
   */
  setGlobalMetricsConfigurations(): void {
    register.setDefaultLabels({ app: DEFAULT_METRICS_APP_LABEL });
    collectDefaultMetrics({ labels: { app: DEFAULT_METRICS_APP_LABEL } });
  }

  /**
   * Refreshes the metrics job counts for all queues by retrieving the current
   * job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'. The
   * job counts are then used to update the gauge metric for each individual
   * queue.
   */
  async refreshJobCountsMetrics(): Promise<void> {
    const monitoredQueues = await this.getMonitoredQueues();
    await processInParallel(
      (queue: MonitoredQueue) => this.refreshJobCountsMetricsForQueue(queue),
      monitoredQueues,
    );
  }

  /**
   * Refreshes the metrics job counts for the given queue by retrieving
   * the current values from Redis and updating the gauge metric.
   * @param queue monitored queue details.
   */
  private async refreshJobCountsMetricsForQueue(
    queue: MonitoredQueue,
  ): Promise<void> {
    const queueType = queue.queueModel.isScheduler ? "scheduler" : "consumer";
    const queueJobCounts = await queue.provider.getJobCounts();
    Object.keys(queueJobCounts).forEach((jobCountEvent: string) => {
      DEFAULT_JOBS_COUNTS_GAUGE.set(
        {
          queueName: queue.provider.name,
          queueEvent: jobCountEvent,
          queueType,
        },
        queueJobCounts[jobCountEvent],
      );
    });
  }

  /**
   * Associate all queues with their respective counters to track the events.
   * The counters are associated for every queue event.
   */
  async associateQueueEventsCountersMetrics(): Promise<void> {
    const queues = await this.getMonitoredQueues();
    queues.forEach((queue) => this.associateCountersToQueueEvents(queue));
  }

  /**
   * Associates a counter to every queue event of the given queue.
   * This allows the metrics to track the events of the queues.
   * @param queue monitored queue details.
   */
  private associateCountersToQueueEvents(queue: MonitoredQueue): void {
    const queueName = queue.provider.name;
    const queueType = queue.queueModel.isScheduler ? "scheduler" : "consumer";
    Object.values(QueuesMetricsEvents).forEach(
      (queueEvent: QueuesMetricsEvents) => {
        this.logger.log(
          `Associating metric counter for queue '${queueName}' event '${queueEvent}'.`,
        );
        queue.provider.on(queueEvent, () => {
          DEFAULT_JOBS_EVENTS_COUNTER.inc({
            queueName,
            queueEvent,
            queueType,
          });
        });
      },
    );
  }

  /**
   * Get the list of monitored queues.
   * If not loaded yet, load it once.
   * @returns list of monitored queues.
   */
  private async getMonitoredQueues(): Promise<MonitoredQueue[]> {
    if (!this.monitoredQueueProviders) {
      const queues = await this.queueService.queueConfigurationModel();
      this.monitoredQueueProviders = queues
        .filter((queueModel) => queueModel.isActive)
        .map((queueModel) => {
          const provider = this.moduleRef.get<Queue>(
            getQueueToken(queueModel.name),
            {
              strict: false,
            },
          );
          return { provider, queueModel };
        });
    }
    return this.monitoredQueueProviders;
  }

  @InjectLogger()
  logger: LoggerService;
}

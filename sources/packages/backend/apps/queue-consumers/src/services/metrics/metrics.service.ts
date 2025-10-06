import { getQueueToken } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { QueueService } from "@sims/services/queue";
import { processInParallel } from "@sims/utilities";
import {
  DEFAULT_METRICS_APP_LABEL,
  QueuesMetricsEvents,
  MonitoredQueue,
  MetricsQueueTypes,
} from "./metrics.models";
import { Queue, Job } from "bull";
import { register, collectDefaultMetrics, Gauge, Counter } from "prom-client";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class MetricsService {
  /**
   * List of queues to be monitored. This list is loaded once
   * and is expected to change only if the application restarts.
   */
  private monitoredQueueProviders: MonitoredQueue[];
  /**
   * Current total number of job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.
   * The information is acquired from Redis.
   */
  private readonly jobCountsGauge: Gauge;
  /**
   * Queue local events counter.
   * The information is kept in memory till collected.
   */
  private readonly jobsEventsCounter: Counter;

  /**
   * Initializes the service and sets up the job counts gauge and jobs events counter metrics.
   * @param moduleRef reference to the module for dependency injection.
   * @param queueService service to interact with queue configurations.
   */
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
    private readonly logger: LoggerService,
  ) {
    this.jobCountsGauge = new Gauge({
      name: "queue_job_counts_current_total",
      help: "Current total number of job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.",
      labelNames: ["queueName", "queueEvent", "queueType"] as const,
      collect: () => this.refreshJobCountsMetrics(),
    });
    this.jobsEventsCounter = new Counter({
      name: "queue_event_total_count",
      help: "Total number of the events for a queue If it is a global event, it will be emitted for every queue-consumer.",
      labelNames: ["queueName", "queueEvent", "queueType"] as const,
    });
  }

  /**
   * Increments the event counter for a specific job event within a queue.
   * @param job the job whose event counter is to be incremented.
   * @param queueEvent the type of event occurring on the job.
   * @param options options for the increment operation.
   * - `incrementValue` the value by which to increment
   * the counter. Defaults to 1 if not provided.
   */
  incrementJobEventCounter(
    job: Job<unknown>,
    queueEvent: QueuesMetricsEvents,
    options?: {
      incrementValue?: number;
    },
  ): void {
    const queueType = job.opts?.repeat
      ? MetricsQueueTypes.Scheduler
      : MetricsQueueTypes.Consumer;
    this.jobsEventsCounter.inc(
      {
        queueName: job.queue.name,
        queueEvent,
        queueType,
      },
      options?.incrementValue ?? 1,
    );
  }

  /**
   * Set global metrics configurations.
   */
  setGlobalMetricsConfigurations(): void {
    register.setDefaultLabels({ app: DEFAULT_METRICS_APP_LABEL });
    collectDefaultMetrics({ labels: { app: DEFAULT_METRICS_APP_LABEL } });
  }

  /**
   * Refreshes the metrics job counts for all queues by retrieving the current
   * job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.
   * The job counts are then used to update the gauge metric for each individual queue.
   */
  private async refreshJobCountsMetrics(): Promise<void> {
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
    const queueType = queue.queueModel.isScheduler
      ? MetricsQueueTypes.Scheduler
      : MetricsQueueTypes.Consumer;
    const queueJobCounts = await queue.provider.getJobCounts();
    Object.keys(queueJobCounts).forEach((jobCountEvent: string) => {
      this.jobCountsGauge.set(
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
    const queueType = queue.queueModel.isScheduler
      ? MetricsQueueTypes.Scheduler
      : MetricsQueueTypes.Consumer;
    Object.values(QueuesMetricsEvents).forEach(
      (queueEvent: QueuesMetricsEvents) => {
        this.logger.log(
          `Associating metric counter for queue '${queueName}' event '${queueEvent}'.`,
        );
        queue.provider.on(queueEvent, () => {
          this.jobsEventsCounter.inc({
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
}

import { getQueueToken as getQueueTokenLegacy } from "@nestjs/bull";
import { getQueueToken } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { QueueService } from "@sims/services/queue";
import {
  BULL_MQ_MIGRATED_QUEUE_NAMES,
  processInParallel,
} from "@sims/utilities";
import {
  DEFAULT_METRICS_APP_LABEL,
  MonitoredQueue,
  MetricsQueueTypes,
  QueuesMetricsEventsLegacy,
  QueueMetricsEvents,
} from "./metrics.models";
import { Queue as QueueLegacy } from "bull";
import { Queue } from "bullmq";
import { register, collectDefaultMetrics, Gauge, Counter } from "prom-client";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class MetricsService {
  /**
   * List of queues to be monitored. This list is loaded once
   * and is expected to change only if the application restarts.
   */
  private monitoredQueueProvidersLegacy: MonitoredQueue<QueueLegacy>[];
  /**
   * List of queues to be monitored. This list is loaded once
   * and is expected to change only if the application restarts.
   */
  private monitoredQueueProviders: MonitoredQueue<Queue>[];
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
      collect: (): Promise<void> => this.refreshJobCountsMetrics(),
    });
    this.jobsEventsCounter = new Counter({
      name: "queue_event_total_count",
      help: "Total number of the events for a queue If it is a global event, it will be emitted for every queue-consumer.",
      labelNames: ["queueName", "queueEvent", "queueType"] as const,
    });
  }

  /**
   * Increments the event counter for a specific job event within a queue.
   * @param queueName the name of the queue.
   * @param isScheduler indicates if the queue is a scheduler.
   * @param queueEvent the type of event occurring on the job.
   * @param options options for the increment operation.
   * - `incrementValue` the value by which to increment
   * the counter. Defaults to 1 if not provided.
   */
  incrementJobEventCounter(
    queueName: string,
    isScheduler: boolean,
    queueEvent: QueueMetricsEvents,
    options?: {
      incrementValue?: number;
    },
  ): void {
    const queueType = isScheduler
      ? MetricsQueueTypes.Scheduler
      : MetricsQueueTypes.Consumer;
    this.jobsEventsCounter.inc(
      {
        queueName: queueName,
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
      (queue: MonitoredQueue<Queue>) =>
        this.refreshJobCountsMetricsForQueue(queue),
      monitoredQueues,
    );
    await this.refreshJobCountsMetricsLegacy();
  }

  /**
   * Refreshes the metrics job counts for all queues by retrieving the current
   * job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.
   * The job counts are then used to update the gauge metric for each individual queue.
   * @deprecated TODO: After bull mq migration, this method will be removed.
   */
  private async refreshJobCountsMetricsLegacy(): Promise<void> {
    const monitoredQueuesLegacy = await this.getMonitoredQueuesLegacy();
    await processInParallel(
      (queue: MonitoredQueue<QueueLegacy>) =>
        this.refreshJobCountsMetricsForQueueLegacy(queue),
      monitoredQueuesLegacy,
    );
  }

  /**
   * Refreshes the metrics job counts for the given queue by retrieving
   * the current values from Redis and updating the gauge metric.
   * @param queue monitored queue details.
   * @deprecated TODO: After bull mq migration, this method will be removed.
   */
  private async refreshJobCountsMetricsForQueueLegacy(
    queue: MonitoredQueue<QueueLegacy>,
  ): Promise<void> {
    const queueJobCounts = await queue.provider.getJobCounts();
    Object.keys(queueJobCounts).forEach((jobCountEvent: string) => {
      this.jobCountsGauge.set(
        {
          queueName: queue.provider.name,
          queueEvent: jobCountEvent,
          queueType: queue.queueType,
        },
        queueJobCounts[jobCountEvent],
      );
    });
  }

  /**
   * Refreshes the metrics job counts for the given queue by retrieving
   * the current values from Redis and updating the gauge metric.
   * @param queue monitored queue details.
   */
  private async refreshJobCountsMetricsForQueue(
    queue: MonitoredQueue<Queue>,
  ): Promise<void> {
    const queueJobCounts = await queue.provider.getJobCounts();
    Object.entries(queueJobCounts).forEach(([jobCountEvent, jobCount]) => {
      this.jobCountsGauge.set(
        {
          queueName: queue.provider.name,
          queueEvent: jobCountEvent,
          queueType: queue.queueType,
        },
        jobCount,
      );
    });
  }

  /**
   * Associate all queues with their respective counters to track the events.
   * The counters are associated for every queue event.
   * @deprecated TODO: After bull mq migration, this method will be removed.
   */
  async associateQueueEventsCountersMetrics(): Promise<void> {
    const queues = await this.getMonitoredQueuesLegacy();
    queues.forEach((queue) => this.associateCountersToQueueEventsLegacy(queue));
  }

  /**
   * Associates a counter to every queue event of the given queue.
   * This allows the metrics to track the events of the queues.
   * @param queue monitored queue details.
   * @deprecated TODO: After bull mq migration, this method will be removed.
   */
  private associateCountersToQueueEventsLegacy(
    queue: MonitoredQueue<QueueLegacy>,
  ): void {
    const queueName = queue.provider.name;
    Object.values(QueuesMetricsEventsLegacy).forEach(
      (queueEvent: QueuesMetricsEventsLegacy) => {
        this.logger.log(
          `Associating metric counter for queue '${queueName}' event '${queueEvent}'.`,
        );
        queue.provider.on(queueEvent, () => {
          this.jobsEventsCounter.inc({
            queueName,
            queueEvent,
            queueType: queue.queueType,
          });
        });
      },
    );
  }

  /**
   * Get the list of monitored legacy queues.
   * If not loaded yet, load it once.
   * @returns list of monitored queues.
   * @deprecated TODO: After bull mq migration, this method will be removed.
   */
  private async getMonitoredQueuesLegacy(): Promise<
    MonitoredQueue<QueueLegacy>[]
  > {
    if (!this.monitoredQueueProvidersLegacy) {
      await this.initializeMonitoredQueues();
    }
    return this.monitoredQueueProvidersLegacy;
  }

  /**
   * Get the list of monitored queues.
   * If not loaded yet, load it once.
   * @returns list of monitored queues.
   */
  private async getMonitoredQueues(): Promise<MonitoredQueue<Queue>[]> {
    if (!this.monitoredQueueProviders) {
      await this.initializeMonitoredQueues();
    }
    return this.monitoredQueueProviders;
  }

  /**
   * Initializes the monitored queues for both legacy and migrated queues.
   */
  private async initializeMonitoredQueues(): Promise<void> {
    const allQueues = await this.queueService.queueConfigurationModel();
    const activeLegacyQueues = allQueues.filter(
      (queueModel) =>
        queueModel.isActive &&
        !BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queueModel.name),
    );
    const activeQueues = allQueues.filter(
      (queueModel) =>
        queueModel.isActive &&
        BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queueModel.name),
    );
    this.monitoredQueueProvidersLegacy = activeLegacyQueues.map(
      (queueModel) => {
        const provider = this.moduleRef.get<QueueLegacy>(
          getQueueTokenLegacy(queueModel.name),
          {
            strict: false,
          },
        );
        const queueType = queueModel.isScheduler
          ? MetricsQueueTypes.Scheduler
          : MetricsQueueTypes.Consumer;
        return { provider, queueType };
      },
    );
    this.monitoredQueueProviders = activeQueues.map((queueModel) => {
      const provider = this.moduleRef.get<Queue>(
        getQueueToken(queueModel.name),
        {
          strict: false,
        },
      );
      const queueType = queueModel.isScheduler
        ? MetricsQueueTypes.Scheduler
        : MetricsQueueTypes.Consumer;
      return { provider, queueType };
    });
  }
}

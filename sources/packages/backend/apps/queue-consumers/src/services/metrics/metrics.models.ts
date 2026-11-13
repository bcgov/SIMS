import { QueueWorkerEvents } from "@sims/utilities";

/**
 * Custom metrics event, not emitted by queue, used to count the warnings
 * reported by a job that was finalized with success.
 */
export enum MetricsCustomQueueEvents {
  /**
   * A job was finished with success but contains at least one warning.
   */
  JobFinalizedWithWarnings = "job-finalized-with-warnings",
}

/**
 * Metrics events for a queue, including both worker events and custom events.
 */
export type QueueMetricsEvents = QueueWorkerEvents | MetricsCustomQueueEvents;

/**
 * Information to provide metrics to a queue.
 */
export interface MonitoredQueue<T> {
  provider: T;
  queueType: MetricsQueueTypes;
}

/**
 * Default label added to all the metrics.
 */
export const DEFAULT_METRICS_APP_LABEL = "queue-consumers";

/**
 * Metrics queue types.
 */
export enum MetricsQueueTypes {
  Scheduler = "scheduler",
  Consumer = "consumer",
}

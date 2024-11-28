import { QueueModel } from "@sims/services/queue";
import { Queue } from "bull";
import { Counter, Gauge } from "prom-client";

/**
 * Bull queues event names to have metrics associated.
 * @see https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#events
 */
export enum QueuesMetricsEvents {
  /**
   * An error occurred, for instance, Redis connectivity issue.
   */
  Error = "error",
  /**
   * A Job is waiting to be processed as soon as a worker is idling.
   */
  Waiting = "waiting",
  /**
   * A job has started.
   */
  Active = "active",
  /**
   * A job has been marked as stalled. This is useful for debugging job
   * workers that crash or pause the event loop.
   */
  Stalled = "stalled",
  /**
   * A job successfully completed with a result.
   */
  Completed = "completed",
  /**
   * A job's progress was updated.
   */
  Progress = "progress",
  /**
   * A job went to failed state.
   */
  Failed = "failed",
  /**
   * The job changed to delayed state.
   */
  Delayed = "delayed",
  /**
   * The queue has been paused.
   */
  Paused = "paused",
  /**
   * A job was successfully removed.
   */
  Removed = "removed",
  /**
   * The queue has been resumed.
   */
  Resumed = "resumed",
  /**
   * Emitted every time the queue has processed all the waiting jobs
   * (even if there can be some delayed jobs not yet processed).
   */
  Drained = "drained",
  /**
   * A job failed to extend lock. This will be useful to debug redis
   * connection issues and jobs getting restarted because workers
   * are not able to extend locks.
   */
  LockExtensionFailed = "lock-extension-failed",
}

/**
 * Information to provide metrics to a queue.
 */
export interface MonitoredQueue {
  provider: Queue;
  queueModel: QueueModel;
}

/**
 * Default label added to all the metrics.
 */
export const DEFAULT_METRICS_APP_LABEL = "queue-consumers";

/**
 * Current total number of job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.
 */
export const DEFAULT_JOBS_COUNTS_GAUGE = new Gauge({
  name: "queue_job_counts_current_total",
  help: "Current total number of job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.",
  labelNames: ["queueName", "queueEvent", "queueType"] as const,
});

/**
 * Queue local events counter.
 */
export const DEFAULT_JOBS_EVENTS_COUNTER = new Counter({
  name: "queue_event_total_count",
  help: "Total number of the events for a queue If it is a global event, it will be emitted for every queue-consumer.",
  labelNames: ["queueName", "queueEvent", "queueType"] as const,
});

import { QueueModel } from "@sims/services/queue";
import { Queue } from "bull";

/**
 * Bull queues event names to have metrics associated (@see https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#events)
 * and others that are useful for monitoring.
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
  /**
   * A job was finished with success but contains at least one warning.
   */
  JobFinalizedWithWarnings = "job-finalized-with-warnings",
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
 * Metrics queue types.
 */
export enum MetricsQueueTypes {
  Scheduler = "scheduler",
  Consumer = "consumer",
}

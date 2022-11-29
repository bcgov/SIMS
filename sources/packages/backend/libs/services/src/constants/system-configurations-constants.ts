import { Duration } from "zeebe-node";

/**
 * Default time that a message can wait, once it is delivery to the broker,
 * to find its correlated key.
 */
export const ZEEBE_PUBLISH_MESSAGE_DEFAULT_TIME_TO_LEAVE =
  Duration.seconds.of(10);

/**
 * Number of attempts that a queue will re-try a failed job.
 */
const QUEUE_RETRY_ATTEMPTS = 3;

/**
 * Delay in milliseconds at which every retry operation is performed on a failed job.
 */
const QUEUE_RETRY_DELAY = 180000;

/**
 * Default retry config to be used for a queue which does not
 * use a queue specific retry configuration.
 */
export const QUEUE_RETRY_DEFAULT_CONFIG = {
  /**
   * Number of attempts that a queue will re-try a failed job.
   */
  attempts: QUEUE_RETRY_ATTEMPTS,
  /**
   * Delay in milliseconds at which every retry operation is performed on a failed job.
   */
  delay: QUEUE_RETRY_DELAY,
};

/**
 * Advanced settings to control additional queue behavior.
 * The values represents the current setting used by the system.
 * More settings can be added. See below documentation for details.
 * @see https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queue
 */
export interface QueueSettings {
  /**
   * Max amount of times a stalled job will be re-processed.
   */
  maxStalledCount?: number;
  /**
   * Key expiration time for job locks.
   */
  lockDuration?: number;
  /**
   * Interval on which to acquire the job lock.
   */
  lockRenewTime?: number;
}

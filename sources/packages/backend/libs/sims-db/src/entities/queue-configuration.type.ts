/**
 * Queue configurations.
 */
export interface QueueConfigurationDetails {
  /**
   * Cron expression.
   */
  cron?: string;
  /**
   * Interval between each retry, interval in milliseconds.
   */
  retryInterval?: number;
  /**
   * Number of retries.
   */
  retry?: number;
  /**
   * readonly dashboard parameter for the queues in the bull board.
   */
  dashboardReadonly?: boolean;
  /**
   * Maximum number of record to process per schedule.
   */
  pollingRecordLimit?: number;
  /**
   * Cleans all jobs that completed over given period in milliseconds.
   */
  cleanUpPeriod?: number;
}

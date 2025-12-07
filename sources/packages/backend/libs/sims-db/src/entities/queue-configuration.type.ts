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
  /**
   * Amount of hours the assessment should be retried in case of getting stuck without processing.
   */
  amountHoursAssessmentRetry?: number;
  /**
   * Maximum number of file uploads to be processed per batch in a T4A upload process.
   */
  maxFileUploadsPerBatch?: number;
}

export interface ProcessNotificationsQueueInDTO {
  /**
   * Maximum number of notifications to process per schedule.
   */
  pollingRecordsLimit: number;
  /**
   * Maximum number of API calls in the allowed window defined by externalRateLimitSeconds.
   */
  externalRateLimit?: number;
  /**
   * Time window in seconds for the API rate limit.
   */
  externalRateLimitSeconds?: number;
}

export interface ProcessNotificationsQueueInDTO {
  /**
   * Maximum number of notifications to process per schedule.
   */
  pollingRecordsLimit: number;
}

export interface ProcessNotificationsResponseQueueOutDTO {
  notificationsProcessed: number;
  notificationsSuccessfullyProcessed: number;
}

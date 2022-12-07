export interface ProcessNotificationsQueueInDTO {
  /** Maximum number of notifications to process per schedule */
  pollingLimit: number;
}

export interface ProcessNotificationsResponseQueueOutDTO {
  notifications: number;
  successfullyProcessed: number;
}

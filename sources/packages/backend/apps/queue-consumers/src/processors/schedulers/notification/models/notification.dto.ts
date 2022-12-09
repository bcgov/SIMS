export interface ProcessNotificationsQueueInDTO {
  /** Maximum number of notifications to process per schedule */
  pollingLimit: number;
}

export interface ProcessNotificationsResponseQueueOutDTO {
  notificationsProcessed: number;
  notificationsSuccessfullyProcessed: number;
}

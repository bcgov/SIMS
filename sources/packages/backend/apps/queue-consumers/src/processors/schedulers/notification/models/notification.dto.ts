export interface ProcessNotificationsQueueInDTO {
  pollingLimit: number;
}

export interface ProcessNotificationsResponseQueueOutDTO {
  notifications: number;
  successfullyProcessed: number;
}

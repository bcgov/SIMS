/**
 * Queue configurations.
 */
export interface QueueConfiguration {
  cron?: string;
  backoff: number;
  attempts: number;
  dashboardReadonly?: boolean;
}

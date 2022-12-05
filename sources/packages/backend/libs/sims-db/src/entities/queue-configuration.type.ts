/**
 * Queue configurations.
 */
export interface QueueConfigurationDetails {
  cron?: string;
  backoff: number;
  attempts: number;
  dashboardReadonly?: boolean;
}

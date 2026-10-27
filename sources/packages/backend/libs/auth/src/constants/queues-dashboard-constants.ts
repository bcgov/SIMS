/**
 * Cookie saved to allow queues admin access.
 */
export const QUEUE_DASHBOARD_AUTH_COOKIE = "queues-dashboard-auth";
/**
 * Token audience to be validated.
 */
export const QUEUE_DASHBOARD_AUDIENCE = "queues-dashboard";
/**
 * Token issuer.
 */
export const QUEUE_DASHBOARD_ISSUER = "sims-api";
/**
 * Message returned when a promote operation is attempted on Bull MQ queues.
 */
export const QUEUE_DASHBOARD_PROMOTE_FORBIDDEN_MESSAGE =
  "Promote operation is forbidden for Bull MQ queues";
/**
 * API pattern for the promote API on Bull Dashboard.
 * Expected format: /api/queues/{queueName}/{jobId}/promote.
 */
export const QUEUE_DASHBOARD_PROMOTE_API_PATTERN =
  /\/queues\/([^/]+)\/[^/]+\/promote(?:\?|$)/;

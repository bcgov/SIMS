import { ApplicationStatus } from "@sims/sims-db";

export const APPLICATION_STATUS_NOT_ALLOWED_FOR_CANCELLATION = [
  ApplicationStatus.completed,
  ApplicationStatus.overwritten,
  ApplicationStatus.cancelled,
];

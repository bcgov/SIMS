import { ApplicationException } from "@sims/sims-db";

export interface ApproveExceptionResult {
  exception: ApplicationException;
  notificationId: number;
}

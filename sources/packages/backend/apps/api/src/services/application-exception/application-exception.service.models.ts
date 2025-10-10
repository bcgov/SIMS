import { ApplicationExceptionRequestStatus } from "@sims/sims-db";

export interface AssessedExceptionRequest {
  exceptionRequestId: number;
  exceptionRequestStatus:
    | ApplicationExceptionRequestStatus.Approved
    | ApplicationExceptionRequestStatus.Declined;
}

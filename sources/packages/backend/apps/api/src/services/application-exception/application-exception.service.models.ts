import { ApplicationExceptionRequestStatus } from "@sims/sims-db";

export interface ApprovalExceptionRequest {
  exceptionRequestId: number;
  exceptionRequestStatus:
    | ApplicationExceptionRequestStatus.Approved
    | ApplicationExceptionRequestStatus.Declined;
}

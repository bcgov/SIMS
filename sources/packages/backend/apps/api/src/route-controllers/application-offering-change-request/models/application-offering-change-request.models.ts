import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

export interface StudentApplicationOfferingChangeRequest {
  studentConsent: boolean;
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}

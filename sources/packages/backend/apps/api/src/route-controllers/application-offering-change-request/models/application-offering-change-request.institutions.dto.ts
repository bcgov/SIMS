import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

/**
 * Eligible applications offering change list details.
 */
export class ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
}

/**
 * Application offering change list.
 */
export class ApplicationOfferingChangeAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}

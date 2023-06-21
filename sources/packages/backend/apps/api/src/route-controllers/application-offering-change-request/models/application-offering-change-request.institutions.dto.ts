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
 * Inprogress application offering change details.
 */
export class InprogressApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}

/**
 * Completed application offering change details.
 */
export class CompletedApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  dateCompleted: Date;
}

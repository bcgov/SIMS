import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

/**
 * Eligible applications offering change list details.
 */
export class ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
}

/**
 * In progress application offering change details.
 */
export class InProgressApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}

/**
 * Completed application offering change details.
 */
export class CompletedApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  dateCompleted: Date;
}

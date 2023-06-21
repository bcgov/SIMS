import { ApplicationOfferingChangeRequestStatus } from "@/types";

/**
 * Eligible applications offering change list details.
 */
export interface ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
}

/**
 * Inprogress application offering change details.
 */
export interface InprogressApplicationOfferingChangesAPIOutDTO {
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
export interface CompletedApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  dateCompleted: Date;
}

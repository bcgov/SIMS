import { ApplicationOfferingChangeRequestStatus } from "@/types";

/**
 * Eligible applications offering change list details.
 */
export interface ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
}

/**
 * In progress application offering change details.
 */
export interface InProgressApplicationOfferingChangesAPIOutDTO {
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
export interface CompletedApplicationOfferingChangesAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  dateCompleted: Date;
}

/**
 * Application Offering Change Request details.
 */
export class ApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationId: number;
  applicationNumber: string;
  locationName: string;
  activeOfferingId: number;
  requestedOfferingId: number;
  requestedOfferingDescription: string;
  requestedOfferingProgramId: number;
  requestedOfferingProgramName: string;
  reason?: string;
  assessedNoteDescription?: string;
}

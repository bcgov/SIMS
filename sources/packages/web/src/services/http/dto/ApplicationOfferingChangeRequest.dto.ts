import {
  ApplicationOfferingChangeRequestStatus,
  OfferingIntensity,
} from "@/types";

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
 * Applications details for an eligible application to request an offering change.
 */
export interface ApplicationOfferingChangeSummaryDetailAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  programId: number;
  offeringId: number;
  offeringIntensity: OfferingIntensity;
  programYearId: number;
  fullName: string;
}

/**
 * In progress application offering change details.
 */
export interface InProgressApplicationOfferingChangesAPIOutDTO {
  id: number;
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
  id: number;
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
export interface ApplicationOfferingChangesAPIOutDTO {
  id: number;
  status: ApplicationOfferingChangeRequestStatus;
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
  studentFullName: string;
}

/**
 * Information provided by the institution to create a new application offering change request.
 */
export interface CreateApplicationOfferingChangeRequestAPIInDTO {
  applicationId: number;
  offeringId: number;
  reason: string;
}

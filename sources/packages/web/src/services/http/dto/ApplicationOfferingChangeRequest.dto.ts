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
  programId: number;
  programIsActive: boolean;
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
 * All in progress application offering change details.
 */
export class AllInProgressApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  createdAt: string;
  studentId: number;
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
 * Application Offering Change Request details for institution view.
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
 * Application Offering Request details for student view.
 */
export interface ApplicationOfferingDetailsAPIOutDTO {
  applicationNumber: string;
  locationName: string;
  status: ApplicationOfferingChangeRequestStatus;
  requestedOfferingId: number;
  activeOfferingId: number;
  reason: string;
}

/**
 * Application Offering Request details for ministry view.
 */
export interface ApplicationOfferingChangeDetailsAPIOutDTO {
  applicationNumber: string;
  locationName: string;
  status: ApplicationOfferingChangeRequestStatus;
  requestedOfferingId: number;
  activeOfferingId: number;
  reason: string;
  assessedNoteDescription: string;
  studentFullName: string;
  assessedDate: Date;
  assessedBy: string;
  institutionId: number;
  institutionName: string;
  submittedDate: Date;
  studentActionDate?: Date;
}

/**
 * Application Offering Change Request Status.
 */
export interface ApplicationOfferingChangeRequestStatusAPIOutDTO {
  status: ApplicationOfferingChangeRequestStatus;
}

/**
 * Information provided by the institution to create a new Application Offering Change Request.
 */
export interface CreateApplicationOfferingChangeRequestAPIInDTO {
  applicationId: number;
  offeringId: number;
  reason: string;
}

/**
 * Information to update the application offering change request by student.
 */
export interface StudentApplicationOfferingChangeRequestAPIInDTO {
  studentConsent: boolean;
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}

export interface ApplicationOfferingChangeAssessmentAPIInDTO {
  note: string;
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}

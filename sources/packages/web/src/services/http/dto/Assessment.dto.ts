import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  Assessment,
  AssessmentStatus,
  AssessmentTriggerType,
  OfferingIntensity,
  StudentAppealStatus,
  StudentAssessmentStatus,
} from "@/types";

export const ASSESSMENT_ALREADY_IN_PROGRESS = "ASSESSMENT_ALREADY_IN_PROGRESS";

export enum RequestAssessmentTypeAPIOutDTO {
  StudentException = "Student exceptions",
  StudentAppeal = "Student appeal",
  OfferingRequest = "Offering request",
}

export interface RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ApplicationExceptionStatus;
  requestType: RequestAssessmentTypeAPIOutDTO;
  programId?: number;
}

export interface AssessmentHistorySummaryAPIOutDTO {
  assessmentId?: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate?: Date;
  status: StudentAssessmentStatus;
  offeringId?: number;
  programId?: number;
  studentAppealId?: number;
  applicationExceptionId?: number;
  studentScholasticStandingId?: number;
  // This flag decides, the row is unsuccessful week or not.
  hasUnsuccessfulWeeks?: boolean;
}

export interface AssessmentNOAAPIOutDTO {
  assessment: Assessment;
  applicationNumber: string;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  msfaaNumber: string;
  disbursement: any;
  noaApprovalStatus: AssessmentStatus;
  applicationStatus: ApplicationStatus;
}

export interface AwardDetailsAPIOutDTO {
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;

  /**
   * Dynamic output of the workflow calculation.
   * Contains data that could represent a part-time or a full-time award details.
   */
  estimatedAward: Record<string, string | number>;
  /**
   * Dynamic output from disbursement receipt for the given disbursement.
   * Contains data that could represent a part-time or a full-time award details.
   */
  finalAward: Record<string, string | number>;
}

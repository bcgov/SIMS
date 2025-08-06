import {
  ApplicationExceptionStatus,
  ApplicationOfferingChangeRequestStatus,
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
  ApplicationOfferingChangeRequest = "Application offering change",
}

export interface RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status:
    | StudentAppealStatus
    | ApplicationExceptionStatus
    | ApplicationOfferingChangeRequestStatus;
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
  applicationOfferingChangeRequestId?: number;
  applicationExceptionId?: number;
  studentScholasticStandingId?: number;
  // This flag decides, the row is unsuccessful week or not.
  hasUnsuccessfulWeeks?: boolean;
}

export interface AssessmentNOAAPIOutDTO {
  assessment: Assessment;
  workflowData: unknown;
  applicationId: number;
  applicationNumber: string;
  applicationCurrentAssessmentId: number;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  msfaaNumber: string;
  disbursement: unknown;
  eligibleAmount: number;
  noaApprovalStatus: AssessmentStatus;
  applicationStatus: ApplicationStatus;
}

/**
 * Dynamic object with awards values.
 * @example
 * {
 *    disbursementReceipt1cslf: 1000,
 *    disbursementReceipt1csgp: 10001,
 *    disbursementReceipt1bcsl: 1005,
 *    disbursementReceipt1bcag: 1006,
 *    disbursementReceipt1bgpd: 1007,
 *    disbursementReceipt1sbsd: 1008,
 *    disbursementReceipt2cslf: 1000,
 *    disbursementReceipt2csgp: 10001,
 *    disbursementReceipt2bcsl: 1005,
 *    disbursementReceipt2bcag: 1006,
 *    disbursementReceipt2bgpd: 1007,
 *    disbursementReceipt2sbsd: 1008,
 *   }
 */
export type DynamicAwardValue = Record<string, string | number | Date>;

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
  estimatedAward: DynamicAwardValue;
  /**
   * Dynamic output from disbursement receipt for the given disbursement.
   * Contains data that could represent a part-time or a full-time award details.
   * If the conditions to have a receipt are not match this information will not be available.
   */
  finalAward?: DynamicAwardValue;
}

export interface ManualReassessmentAPIInDTO {
  note: string;
}

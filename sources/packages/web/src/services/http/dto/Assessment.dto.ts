import {
  ApplicationExceptionStatus,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  Assessment,
  AssessmentStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
  StudentAppealStatus,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
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
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  scholasticStandingReversalDate?: Date;
  // This flag decides, the row is unsuccessful week or not.
  hasUnsuccessfulWeeks?: boolean;
}

export interface AssessmentNOAAPIOutDTO {
  assessment: Assessment;
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
export type DynamicAwardValue = Record<
  string,
  string | number | Date | boolean
>;

/**
 * Award details including disbursement schedules.
 */
export interface AwardDetailsAPIOutDTO {
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  firstDisbursement: AwardDisbursementScheduleAPIOutDTO;
  secondDisbursement?: AwardDisbursementScheduleAPIOutDTO;
}

/**
 * Disbursement schedule details for Awards.
 */
export interface AwardDisbursementScheduleAPIOutDTO {
  disbursementDate: string;
  status: DisbursementScheduleStatus;
  coeStatus: COEStatus;
  msfaaNumber: string;
  msfaaId: number;
  msfaaCancelledDate?: string;
  msfaaDateSigned?: string;
  tuitionRemittance: number;
  enrolmentDate?: Date;
  id: number;
  statusUpdatedOn: Date;
  dateSent?: Date;
  documentNumber?: number;
  disbursementValues: AwardDisbursementValueAPIOutDTO[];
  receiptReceived: boolean;
}
/**
 * Disbursement values for Awards.
 */
export interface AwardDisbursementValueAPIOutDTO {
  valueCode: string;
  valueAmount: number;
  effectiveAmount?: number;
  hasRestrictionAdjustment?: boolean;
  hasDisbursedAdjustment?: boolean;
  hasPositiveOverawardAdjustment?: boolean;
  hasNegativeOverawardAdjustment?: boolean;
}

export interface ManualReassessmentAPIInDTO {
  note: string;
}

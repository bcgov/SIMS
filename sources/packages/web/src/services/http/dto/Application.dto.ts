import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  ProgramInfoStatus,
  SuccessWaitingStatus,
  COEStatus,
  AssessmentStatus,
  OfferingIntensity,
  DisbursementScheduleStatus,
  AssessmentTriggerType,
  StudentAppealStatus,
  StudentScholasticStandingChangeType,
  ApplicationOfferingChangeRequestStatus,
  StudentAssessmentStatus,
} from "@/types";

export interface InProgressApplicationDetailsAPIOutDTO {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  pirDeniedReason?: string;
  exceptionStatus?: ApplicationExceptionStatus;
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
  outstandingAssessmentStatus: SuccessWaitingStatus;
}

export interface SaveApplicationAPIInDTO {
  programYearId: number;
  data: unknown;
  associatedFiles: string[];
}

export interface ApplicationWithProgramYearAPIOutDTO {
  applicationId: number;
  formName: string;
  programYearId: number;
  active: boolean;
}

/**
 * Application and program year base
 * information.
 */
export interface ApplicationProgramYearAPIOutDTO {
  id: number;
  applicationNumber: string;
  programYear: string;
}

/**
 * Base DTO for application dynamic data
 */
export interface ApplicationBaseAPIOutDTO {
  id: number;
  applicationNumber: string;
  assessmentId?: number;
  data: any;
  applicationStatus: ApplicationStatus;
  applicationFormName: string;
  applicationProgramYearID: number;
}

/**
 * DTO for detailed application data
 */
export interface ApplicationDataAPIOutDTO extends ApplicationBaseAPIOutDTO {
  applicationStatusUpdatedOn: string;
  applicationOfferingIntensity: OfferingIntensity;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationPIRStatus: ProgramInfoStatus;
  applicationAssessmentStatus: AssessmentStatus;
  applicationCOEStatus: COEStatus;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
  programYearStartDate: string;
  programYearEndDate: string;
  submittedDate?: Date;
}

/**
 * Interface for application summary
 */
export interface ApplicationSummaryDTO {
  id: number;
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationName: string;
  submitted: string;
  status: string;
}

export interface ApplicationProgressDetailsAPIOutDTO {
  applicationStatus: ApplicationStatus;
  applicationStatusUpdatedOn: Date;
  pirStatus?: ProgramInfoStatus;
  firstCOEStatus?: COEStatus;
  secondCOEStatus?: COEStatus;
  exceptionStatus?: ApplicationExceptionStatus;
  appealStatus?: StudentAppealStatus;
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  applicationOfferingChangeRequestStatus?: ApplicationOfferingChangeRequestStatus;
  assessmentTriggerType?: AssessmentTriggerType;
  hasFeedbackError: boolean;
}

export interface DisbursementDetailsAPIOutDTO {
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  coeDenialReason: string;
}

export interface EnrolmentApplicationDetailsAPIOutDTO {
  firstDisbursement: DisbursementDetailsAPIOutDTO;
  secondDisbursement?: DisbursementDetailsAPIOutDTO;
  assessmentTriggerType: AssessmentTriggerType;
}

export interface CompletedApplicationDetailsAPIOutDTO
  extends EnrolmentApplicationDetailsAPIOutDTO {
  assessmentTriggerType: AssessmentTriggerType;
  firstDisbursement: DisbursementDetailsAPIOutDTO;
  secondDisbursement?: DisbursementDetailsAPIOutDTO;
  appealStatus?: StudentAppealStatus;
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  applicationOfferingChangeRequestId?: number;
  applicationOfferingChangeRequestStatus?: ApplicationOfferingChangeRequestStatus;
  hasFeedbackError: boolean;
}

export interface ApplicationAssessmentStatusDetailsAPIOutDTO {
  applicationId: number;
  originalAssessmentStatus: StudentAssessmentStatus;
  isApplicationArchived: boolean;
  applicationStatus: ApplicationStatus;
}

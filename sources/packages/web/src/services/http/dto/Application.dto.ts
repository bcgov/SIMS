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
  ECertFailedValidation,
  ChangeTypes,
  ApplicationEditStatus,
} from "@/types";

interface ApplicationSupportingUserDetails {
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
}

export interface ApplicationIncomeVerification {
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export interface InProgressApplicationDetailsAPIOutDTO
  extends ApplicationSupportingUserDetails,
    ApplicationIncomeVerification {
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

export interface CreateApplicationAPIInDTO {
  programYearId: number;
  offeringIntensity: OfferingIntensity;
  data: unknown;
  associatedFiles: string[];
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
  isArchived: boolean;
  assessmentId?: number;
  data: any;
  applicationStatus: ApplicationStatus;
  applicationFormName: string;
  applicationProgramYearID: number;
  /**
   * Indicates if the application is able to use the
   * change request feature. Other conditions may apply.
   */
  isChangeRequestAllowedForPY: boolean;
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

export interface ApplicationDataChangeAPIOutDTO {
  key?: string;
  index?: number;
  changeType: ChangeTypes;
  changes?: ApplicationDataChangeAPIOutDTO[];
}

/**
 * DTO for application data
 */
export interface ApplicationSupplementalDataAPIOutDTO
  extends ApplicationBaseAPIOutDTO {
  studentFullName: string;
  applicationOfferingIntensity?: OfferingIntensity;
  applicationStartDate?: string;
  applicationEndDate?: string;
  applicationInstitutionName?: string;
  changes?: ApplicationDataChangeAPIOutDTO[];
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
  hasBlockFundingFeedbackError: boolean;
  hasECertFailedValidations: boolean;
  currentAssessmentId: number;
}

export interface DisbursementDetailsAPIOutDTO {
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  coeDenialReason: string;
}

export interface EnrolmentApplicationDetailsAPIOutDTO {
  firstDisbursement?: DisbursementDetailsAPIOutDTO;
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
  hasBlockFundingFeedbackError: boolean;
  eCertFailedValidations: ECertFailedValidation[];
  changeRequestInProgress?: ChangeRequestInProgressAPIOutDTO;
}

export interface ChangeRequestInProgressAPIOutDTO
  extends ApplicationSupportingUserDetails,
    ApplicationIncomeVerification {
  applicationId: number;
  applicationEditStatus:
    | ApplicationEditStatus.ChangeInProgress
    | ApplicationEditStatus.ChangePendingApproval;
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
}

export interface ApplicationAssessmentStatusDetailsAPIOutDTO {
  applicationId: number;
  originalAssessmentStatus: StudentAssessmentStatus;
  isApplicationArchived: boolean;
  applicationStatus: ApplicationStatus;
}

export interface ApplicationWarningsAPIOutDTO {
  eCertFailedValidations: ECertFailedValidation[];
  canAcceptAssessment: boolean;
}

export interface ApplicationVersionAPIOutDTO {
  id: number;
  submittedDate: Date;
  applicationEditStatus: ApplicationEditStatus;
}

export interface ApplicationOverallDetailsAPIOutDTO {
  previousVersions: ApplicationVersionAPIOutDTO[];
}

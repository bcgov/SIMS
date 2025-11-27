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
  SupportingUserType,
} from "@/types";

export interface ParentDetails {
  supportingUserId: number;
  parentFullName: string;
  status: SuccessWaitingStatus;
  isAbleToReport?: boolean;
}
export interface ApplicationIdentifiableSupportingUserDetails {
  partnerInfo?: SuccessWaitingStatus;
  parentsInfo?: ParentDetails[];
}

export interface ApplicationIncomeVerification {
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export interface InProgressApplicationDetailsAPIOutDTO
  extends ApplicationIdentifiableSupportingUserDetails,
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

interface SupportingUserParent {
  id: number;
  fullName: string;
}

/**
 * Application details for an appeal.
 */
export interface AppealApplicationDetailsAPIOutDTO {
  id: number;
  applicationNumber: string;
  programYear: string;
  supportingUserParents: SupportingUserParent[];
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
  applicationEditStatus: ApplicationEditStatus;
  applicationOfferingIntensity: OfferingIntensity;
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
  applicationOfferingIntensity: OfferingIntensity;
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

export interface ECertFailedValidationsInfoAPIOutDTO {
  hasEffectiveAviationRestriction: boolean;
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
  eCertFailedValidationsInfo?: ECertFailedValidationsInfoAPIOutDTO;
  changeRequestInProgress?: ChangeRequestInProgressAPIOutDTO;
}

export interface ChangeRequestInProgressAPIOutDTO
  extends ApplicationIdentifiableSupportingUserDetails,
    ApplicationIncomeVerification {
  applicationId: number;
  applicationEditStatus:
    | ApplicationEditStatus.ChangeInProgress
    | ApplicationEditStatus.ChangePendingApproval;
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export interface ApplicationAssessmentStatusDetailsAPIOutDTO {
  applicationId: number;
  originalAssessmentStatus: StudentAssessmentStatus;
  isApplicationArchived: boolean;
  applicationStatus: ApplicationStatus;
  assessmentDate: Date;
}

export interface ApplicationWarningsAPIOutDTO {
  eCertFailedValidations: ECertFailedValidation[];
  canAcceptAssessment: boolean;
  eCertFailedValidationsInfo?: ECertFailedValidationsInfoAPIOutDTO;
}

export interface ApplicationSupportingUsersAPIOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
  supportingUserFullName?: string;
  isAbleToReport?: boolean;
}

/**
 * Represents a version of an application at any given time,
 * including the current application, any in-progress
 * change requests, and any past versions.
 */
export interface ApplicationVersionAPIOutDTO {
  id: number;
  submittedDate: Date;
  applicationEditStatus: ApplicationEditStatus;
  supportingUsers: ApplicationSupportingUsersAPIOutDTO[];
}

export interface ApplicationOverallDetailsAPIOutDTO {
  currentApplication: ApplicationVersionAPIOutDTO;
  inProgressChangeRequest?: ApplicationVersionAPIOutDTO;
  previousVersions: ApplicationVersionAPIOutDTO[];
}

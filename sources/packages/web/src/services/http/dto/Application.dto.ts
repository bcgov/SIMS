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
 * DTO with primary identifiers of application.
 */
export interface ApplicationIdentifiersAPIOutDTO {
  id: number;
  applicationNumber: string;
}

/**
 * Base DTO for application dynamic data
 */
export interface ApplicationBaseAPIOutDTO
  extends ApplicationIdentifiersAPIOutDTO {
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
export interface ApplicationSummaryDTO extends ApplicationIdentifiersAPIOutDTO {
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
}

export interface DisbursementDetailsAPIOutDTO {
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  coeDenialReason: string;
}

export interface EnrolmentApplicationDetailsAPIOutDTO {
  firstDisbursement: DisbursementDetailsAPIOutDTO;
  secondDisbursement?: DisbursementDetailsAPIOutDTO;
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
}

import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  OfferingStatus,
  ProgramInfoStatus,
  SuccessWaitingStatus,
  COEStatus,
  AssessmentStatus,
  OfferingIntensity,
} from "@/types";

export interface InProgressApplicationDetailsAPIOutDTO {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  pirDeniedReason?: string;
  offeringStatus?: OfferingStatus;
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
  data: any;
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
export interface GetApplicationBaseAPIOutDTO
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
export interface GetApplicationDataAPIOutDTO
  extends GetApplicationBaseAPIOutDTO {
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

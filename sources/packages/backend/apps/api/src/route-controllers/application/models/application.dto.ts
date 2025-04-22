import { IntersectionType } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional, IsPositive } from "class-validator";
import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationData,
  OfferingIntensity,
  DisbursementScheduleStatus,
  StudentAppealStatus,
  AssessmentTriggerType,
  StudentScholasticStandingChangeType,
  ApplicationOfferingChangeRequestStatus,
  StudentAssessmentStatus,
  ApplicationEditStatus,
  ApplicationEditStatusInProgress,
  SupportingUserType,
} from "@sims/sims-db";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { JSON_20KB } from "../../../constants";
import { ECertFailedValidation } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { ChangeTypes } from "@sims/utilities";

export class CreateApplicationAPIInDTO {
  /**
   * Application dynamic data.
   */
  @IsObject()
  @JsonMaxSize(JSON_20KB)
  data: any;
  /**
   * Array of unique file names to be associated
   * with this application.
   */
  @IsOptional()
  associatedFiles: string[];
  /**
   * Selected form of the application.
   * This will be used for ProgramYear active validation
   */
  @IsPositive()
  programYearId: number;
  /**
   * Selected offering intensity of the application.
   */
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
}

export class SaveApplicationAPIInDTO {
  /**
   * Application dynamic data.
   */
  @IsObject()
  @JsonMaxSize(JSON_20KB)
  data: any;
  /**
   * Array of unique file names to be associated
   * with this application.
   */
  @IsOptional()
  associatedFiles: string[];
  /**
   * Selected form of the application.
   * This will be used for ProgramYear active validation
   */
  @IsPositive()
  programYearId: number;
}

export interface ApplicationFormData extends ApplicationData {
  /**
   * Offering name selected by the student.
   * This is for html component of readonly form.
   */
  selectedOfferingName?: string;

  /**
   * Program name selected by the student.
   * This is for html component of readonly form.
   */
  selectedProgramName?: string;

  /**
   * Location name selected by the student.
   * This is for html component of readonly form.
   */
  selectedLocationName?: string;

  /**
   * Program details of the selected program
   * this is HTML Component in formio, this
   * should'not be saved in db
   */
  selectedProgramDesc?: {
    credentialType?: string;
    credentialTypeToDisplay?: string;
    deliveryMethod?: string;
    description?: string;
    id?: number;
    name?: string;
  };
}
/**
 * Application and program year base
 * information.
 */
export class ApplicationProgramYearAPIOutDTO {
  id: number;
  applicationNumber: string;
  programYear: string;
}

/**
 * Base DTO for application
 */
export class ApplicationBaseAPIOutDTO {
  id: number;
  applicationNumber: string;
  isArchived: boolean;
  assessmentId?: number;
  data: ApplicationFormData;
  applicationStatus: ApplicationStatus;
  applicationOfferingIntensity: OfferingIntensity;
  applicationFormName: string;
  applicationProgramYearID: number;
  /**
   * Indicates if the application is able to use the
   * change request feature. Other conditions may apply.
   */
  isChangeRequestAllowedForPY: boolean;
}

export class ApplicationDataAPIOutDTO extends ApplicationBaseAPIOutDTO {
  applicationStatusUpdatedOn: Date;
  /**
   * Offering intensity for the application. It represents the offering intensity
   * associated with the current offering or the selected intensity in the application
   * if the offering is not available (if a PIR is needed).
   */
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationPIRStatus: ProgramInfoStatus;
  applicationCOEStatus: COEStatus;
  applicationAssessmentStatus?: AssessmentStatus;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
  programYearStartDate: string;
  programYearEndDate: string;
  submittedDate?: Date;
}

export class ApplicationDataChangeAPIOutDTO {
  key?: string;
  index?: number;
  changeType: ChangeTypes;
  changes?: ApplicationDataChangeAPIOutDTO[];
}

export class ApplicationSupplementalDataAPIOutDTO extends ApplicationBaseAPIOutDTO {
  studentFullName: string;
  applicationStartDate?: string;
  applicationEndDate?: string;
  applicationInstitutionName?: string;
  changes?: ApplicationDataChangeAPIOutDTO[];
}

export class ApplicationWithProgramYearAPIOutDTO {
  applicationId: number;
  formName: string;
  programYearId: number;
  active: boolean;
}

export enum SuccessWaitingStatus {
  Success = "Success",
  Waiting = "Waiting",
}

export class ApplicationIncomeVerification {
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export class ApplicationSupportingUserDetails {
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
}

export class InProgressApplicationDetailsAPIOutDTO extends IntersectionType(
  ApplicationSupportingUserDetails,
  ApplicationIncomeVerification,
) {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  pirDeniedReason?: string;
  exceptionStatus?: ApplicationExceptionStatus;
  outstandingAssessmentStatus: SuccessWaitingStatus;
}

export class ApplicationProgressDetailsAPIOutDTO {
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

export class DisbursementDetailsAPIOutDTO {
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  coeDenialReason: string;
}

export class EnrolmentApplicationDetailsAPIOutDTO {
  firstDisbursement?: DisbursementDetailsAPIOutDTO;
  secondDisbursement?: DisbursementDetailsAPIOutDTO;
  assessmentTriggerType?: AssessmentTriggerType;
}

export class CompletedApplicationDetailsAPIOutDTO extends EnrolmentApplicationDetailsAPIOutDTO {
  assessmentTriggerType: AssessmentTriggerType;
  appealStatus?: StudentAppealStatus;
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  applicationOfferingChangeRequestId?: number;
  applicationOfferingChangeRequestStatus?: ApplicationOfferingChangeRequestStatus;
  hasBlockFundingFeedbackError: boolean;
  eCertFailedValidations: ECertFailedValidation[];
  changeRequestInProgress?: ChangeRequestInProgressAPIOutDTO;
}

export class ChangeRequestInProgressAPIOutDTO extends IntersectionType(
  ApplicationSupportingUserDetails,
  ApplicationIncomeVerification,
) {
  applicationId: number;
  applicationEditStatus: ApplicationEditStatusInProgress;
}

export class ApplicationAssessmentStatusDetailsAPIOutDTO {
  applicationId: number;
  originalAssessmentStatus: StudentAssessmentStatus;
  isApplicationArchived: boolean;
  applicationStatus: ApplicationStatus;
}

export class ApplicationWarningsAPIOutDTO {
  eCertFailedValidations: ECertFailedValidation[];
  canAcceptAssessment: boolean;
}

export interface ApplicationSupportingUsersAPIOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export class ApplicationSupportingUsersAPIOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export class ApplicationVersionAPIOutDTO {
  id: number;
  submittedDate: Date;
  applicationEditStatus: ApplicationEditStatus;
  supportingUsers: ApplicationSupportingUsersAPIOutDTO[];
}

export class ApplicationOverallDetailsAPIOutDTO {
  currentApplication: ApplicationVersionAPIOutDTO;
  inProgressChangeRequest?: ApplicationVersionAPIOutDTO;
  previousVersions: ApplicationVersionAPIOutDTO[];
}

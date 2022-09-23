import { IsObject, IsOptional, IsPositive } from "class-validator";
import {
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationData,
  OfferingIntensity,
  OfferingStatus,
  ApplicationExceptionStatus,
} from "../../../database/entities";

export class SaveApplicationDto {
  /**
   * Application dynamic data.
   */
  @IsObject()
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
 * Application DTO with primary identifier(s)
 */
export class ApplicationIdentifiersDTO {
  id: number;
  applicationNumber: string;
}

/**
 * Base DTO for application
 */
export class GetApplicationBaseDTO extends ApplicationIdentifiersDTO {
  assessmentId?: number;
  data: ApplicationFormData;
  applicationStatus: ApplicationStatus;
  applicationFormName: string;
  applicationProgramYearID: number;
}
export class GetApplicationDataDto extends GetApplicationBaseDTO {
  applicationStatusUpdatedOn: Date;
  applicationOfferingIntensity: OfferingIntensity;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationPIRStatus: ProgramInfoStatus;
  applicationCOEStatus: COEStatus;
  applicationAssessmentStatus?: AssessmentStatus;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
  programYearStartDate: Date;
  programYearEndDate: Date;
}

export interface ApplicationStatusToBeUpdatedDto {
  applicationStatus: ApplicationStatus;
}

export interface ApplicationWithProgramYearDto {
  applicationId: number;
  formName: string;
  programYearId: number;
  active: boolean;
}

export interface InProgressApplicationDetails {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  PIRDeniedReason: string;
  offeringStatus: OfferingStatus;
  exceptionStatus: ApplicationExceptionStatus;
  parent1IncomeVerificationStatusWaiting: boolean;
  parent1IncomeVerificationStatusSuccess: boolean;
  parent2IncomeVerificationStatusWaiting: boolean;
  parent2IncomeVerificationStatusSuccess: boolean;
  partnerIncomeVerificationStatusWaiting: boolean;
  partnerIncomeVerificationStatusSuccess: boolean;
  studentIncomeVerificationStatusWaiting: boolean;
  studentIncomeVerificationStatusSuccess: boolean;
  parent1InfoSuccess: boolean;
  parent2InfoSuccess: boolean;
  parent1InfoWaiting: boolean;
  parent2InfoWaiting: boolean;
  partnerInfoSuccess: boolean;
  partnerInfoWaiting: boolean;
}

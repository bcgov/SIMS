import { IsObject, IsOptional, IsPositive } from "class-validator";
import {
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationData,
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
  applicationOfferingIntensity: string;
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

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  fullName: string;
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

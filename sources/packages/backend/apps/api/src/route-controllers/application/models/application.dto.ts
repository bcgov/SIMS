import { IsObject, IsOptional, IsPositive, Length } from "class-validator";
import {
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationData,
  OfferingIntensity,
  APPLICATION_NUMBER_LENGTH,
} from "@sims/sims-db";

export class SaveApplicationAPIInDTO {
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
export class ApplicationIdentifiersAPIOutDTO {
  id: number;
  applicationNumber: string;
}

/**
 * Base DTO for application
 */
export class GetApplicationBaseAPIOutDTO extends ApplicationIdentifiersAPIOutDTO {
  assessmentId?: number;
  data: ApplicationFormData;
  applicationStatus: ApplicationStatus;
  applicationFormName: string;
  applicationProgramYearID: number;
}

export class GetApplicationDataAPIOutDTO extends GetApplicationBaseAPIOutDTO {
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
  programYearStartDate: string;
  programYearEndDate: string;
  submittedDate?: Date;
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

export class ApplicationNumberParamAPIInDTO {
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH)
  applicationNumber: string;
}

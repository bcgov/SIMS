import { IsObject, IsOptional, IsPositive } from "class-validator";
import {
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  Assessment,
  OfferingIntensity,
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
 * Base DTO for application
 */
export interface GetApplicationBaseDTO {
  data: ApplicationFormData;
  id: number;
  applicationStatus: ApplicationStatus;
  applicationNumber: string;
  applicationFormName: string;
  applicationProgramYearID: number;
}
export interface GetApplicationDataDto extends GetApplicationBaseDTO {
  /**
   * Application dynamic data.
   */
  applicationStatusUpdatedOn: Date;
  applicationOfferingIntensity: string;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationPIRStatus: ProgramInfoStatus;
  applicationCOEStatus: COEStatus;
  applicationAssessmentStatus: AssessmentStatus;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
  programYearStartDate: Date;
  programYearEndDate: Date;
}

export interface ApplicationOfferingDetails {
  id: number;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  offeringIntensity: string;
}

export interface ApplicationProgramDetails {
  programCredentialType: string;
  programLength: string;
}

export interface ApplicationInstitutionDetails {
  institutionType: string;
}

export interface ApplicationLocationDetails {
  institutionLocationProvince: string;
}

export interface ApplicationStudentDetails {
  studentPDStatus: boolean;
}

export interface ProgramYearDetails {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

export interface ApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
  /**
   * Program Year is added to integrate the application in camunda workflows.
   * Kept for backward compatibility. To be removed in upcoming PR.
   */
  programYear: string;
  /**
   * Details of the program year associated with the student application.
   */
  programYearDetail: ProgramYearDetails;
  /**
   * Offering details for student application.
   */
  offering: ApplicationOfferingDetails;
  /**
   * Program details for student application.
   */
  program: ApplicationProgramDetails;

  /**
   * Institution details for student application.
   */
  institution: ApplicationInstitutionDetails;

  /**
   * Location details for student application.
   */
  location: ApplicationLocationDetails;

  /**
   * Student details for student application.
   */
  student: ApplicationStudentDetails;
}

export interface ActiveApplicationSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  applicationStatus: string;
  fullName: string;
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
export interface COESummaryDTO {
  applicationNumber: string;
  studyStartPeriod: Date;
  studyEndPeriod: Date;
  applicationId: number;
  coeStatus: COEStatus;
  fullName: string;
  disbursementScheduleId: number;
  disbursementDate: string;
}

export interface ApplicationWithProgramYearDto {
  applicationId: number;
  formName: string;
  programYearId: number;
  active: boolean;
}

export interface ActiveApplicationDataDto {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
}

/**
 * DTO for NOA view.
 */
export interface NOAApplicationDto {
  assessment: Assessment;
  applicationNumber: string;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  msfaaNumber: string;
  disbursement: any;
}

/**
 * DTO object application summary info.
 */
export interface ApplicationSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  submitted: string;
  status: string;
}

export interface StudentApplicationAndCount {
  applications: ApplicationSummaryDTO[];
  totalApplications: number;
}

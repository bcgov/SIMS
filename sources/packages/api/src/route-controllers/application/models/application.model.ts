import { IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import { ApplicationStatus } from "../../../database/entities";

export class SaveApplicationDto {
  /**
   * Application dynamic data.
   */
  @IsNotEmpty()
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
  @IsInt()
  @Min(1)
  programYearId: number;
}
export interface GetApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
  id: number;
  applicationStatus: ApplicationStatus;
  applicationStatusUpdatedOn: Date;
}

export interface ApplicationOfferingDetails {
  id: number;
  studyStartDate: Date;
  studyEndDate: Date;
  breakStartDate: Date;
  breakEndDate: Date;
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

export interface ApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
  /**
   * Program Year is added to integrate the application in camunda workflows
   */
  programYear: string;

  /**
   * Offering details fro student application
   */
  offering: ApplicationOfferingDetails;

  /**
   * Program details fro student application
   */
  program: ApplicationProgramDetails;

  /**
   * Institution details fro student application
   */
  institution: ApplicationInstitutionDetails;

  /**
   * Location details fro student application
   */
  location: ApplicationLocationDetails;

  /**
   * Student details fro student application
   */
  student: ApplicationStudentDetails;
}

export interface StudentApplicationDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
}

export interface ApplicationStatusToBeUpdatedDto {
  applicationStatus: ApplicationStatus;
}
export interface COESummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: string;
  firstName: string;
  lastName: string;
}

export interface ProgramYearOfApplicationDto {
  applicationId: number;
  formName: string;
  programYearId: number;
}

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
export interface ApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
  /**
   * Program Year is added to integrate the application in camunda workflows
   */
  programYear: string;
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

export interface ApplicationDetailsForCOEDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationOfferingHasStudyBreak: boolean;
  applicationOfferingBreakStartDate: string;
  applicationOfferingBreakEndDate: string;
  applicationOfferingActualTuition: number;
  applicationOfferingProgramRelatedCost: number;
  applicationOfferingMandatoryCost: number;
  applicationOfferingExceptionalExpenses: number;
  applicationOfferingHasTuitionRemittanceRequested: string;
  applicationOfferingTuitionRemittanceAmount: number;
  applicationOfferingStudyDelivered: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationCOEStatus: string;
  applicationId: number;
  applicationWithin21DayWindow: boolean;
  applicationLocationId: number;
}

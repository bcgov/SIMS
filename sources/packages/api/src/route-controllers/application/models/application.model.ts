import { IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import {
  ApplicationStatus,
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  Application,
  Assessment,
  OfferingIntensity,
  DisbursementSchedule,
} from "../../../database/entities";
import {
  dateString,
  getPIRDeniedReason,
  getCOEDeniedReason,
} from "../../../utilities";
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

/**
 * Base DTO for application
 */
export interface GetApplicationBaseDTO {
  data: any;
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

/**
 * Transformation util for Application.
 * @param application
 * @returns Application DTO
 */
export const transformToApplicationDto = (
  application: Application,
): GetApplicationBaseDTO => {
  return {
    data: application.data,
    id: application.id,
    applicationStatus: application.applicationStatus,
    applicationNumber: application.applicationNumber,
    applicationFormName: application.programYear.formName,
    applicationProgramYearID: application.programYear.id,
  } as GetApplicationBaseDTO;
};

/**
 * Transformation util for Application.
 * @param application
 * @returns Application DTO
 */
export const transformToApplicationDetailDto = (
  applicationDetail: Application,
  disbursement: DisbursementSchedule,
): GetApplicationDataDto => {
  return {
    data: applicationDetail.data,
    id: applicationDetail.id,
    applicationStatus: applicationDetail.applicationStatus,
    applicationStatusUpdatedOn: applicationDetail.applicationStatusUpdatedOn,
    applicationNumber: applicationDetail.applicationNumber,
    applicationOfferingIntensity: applicationDetail.offering?.offeringIntensity,
    applicationStartDate: dateString(
      applicationDetail.offering?.studyStartDate,
    ),
    applicationEndDate: dateString(applicationDetail.offering?.studyEndDate),
    applicationInstitutionName: applicationDetail.location?.name,
    applicationPIRStatus: applicationDetail.pirStatus,
    applicationAssessmentStatus: applicationDetail.assessmentStatus,
    applicationFormName: applicationDetail.programYear.formName,
    applicationProgramYearID: applicationDetail.programYear.id,
    applicationPIRDeniedReason: getPIRDeniedReason(applicationDetail),
    programYearStartDate: applicationDetail.programYear.startDate,
    programYearEndDate: applicationDetail.programYear.endDate,
    applicationCOEStatus: disbursement?.coeStatus,
    applicationCOEDeniedReason: disbursement
      ? getCOEDeniedReason(disbursement)
      : undefined,
  };
};

import { ProgramInfoStatus, COEStatus, AssessmentStatus } from "@/types";
export interface SaveStudentApplicationDto {
  programYearId: number;
  data: any;
  associatedFiles: string[];
}

export interface CreateApplicationDraftResult {
  draftAlreadyExists: boolean;
  draftId?: number;
}

export interface ProgramYearOfApplicationDto {
  applicationId: number;
  formName: string;
  programYearId: number;
}
/**
 * Possible status of a Student Application.
 */
export enum ApplicationStatus {
  /**
   * The application is in draft state and is not Submitted.
   */
  draft = "Draft",
  /**
   * The application has been submitted by the student.
   */
  submitted = "Submitted",
  /**
   * The application is submitted and Camunda Workflow has been started.
   * This is an overall state for "gathering required information required for assessment"
   * (Eg. PIR/Income Validation/Spouse Information/Parent Information)
   */
  inProgress = "In Progress",
  /**
   * Camunda Workflow completed the assessment.
   * The NOA has been populated and presented to the student for confirmation.
   */
  assessment = "Assessment",
  /**
   * The NOA has been accepted and the institution needs to confirm enrollment.
   */
  enrollment = "Enrollment",
  /**
   * The application has been confirmed by the institution.
   */
  completed = "Completed",
  /**
   * The application has been cancelled by the student.
   */
  cancelled = "Cancelled",
  /**
   * The application was replaced by a new version due to some event like
   * an edit on Confirmation of Enrollment that forces the assessment to
   * be reevaluated. Is this case the application is cloned and and the
   * old version is marked as 'Overwritten'.
   * Another case when an Application status is set to overwritten,
   * when a student tries to edit and existing in progress
   * (i.e, application status - submitted , inProgress , assessment , enrollment )
   * application.
   * An Overwritten application should never be modified, once an application
   * is Overwritten and a clone/new version is created all edits should take
   * place on new record.
   */
  overwritten = "Overwritten",
}

export interface ApplicationStatusToBeUpdatedDto {
  applicationStatus: ApplicationStatus;
}

/**
 * Base DTO for application dynamic data
 */
export interface GetApplicationBaseDTO {
  data: any;
  id: number;
  applicationStatus: ApplicationStatus;
  applicationNumber: string;
  applicationFormName: string;
  applicationProgramYearID: number;
}

/**
 * DTO for detailed application data
 */
export interface GetApplicationDataDto extends GetApplicationBaseDTO {
  applicationStatusUpdatedOn: string;
  applicationOfferingIntensity: string;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationPIRStatus: ProgramInfoStatus;
  applicationAssessmentStatus: AssessmentStatus;
  applicationCOEStatus: COEStatus;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
}

export interface ApplicationSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: string;
  fullName: string;
}

export interface StudentApplicationDetails {
  applicationStatusUpdatedOn: string;
  applicationNumber: string;
  applicationOfferingIntensity: string;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationInstitutionName: string;
  applicationStatus: ApplicationStatus;
}

export interface StudentApplicationDetailsForTracking {
  applicationPIRStatus: ProgramInfoStatus;
  applicationAssessmentStatus: AssessmentStatus;
  applicationCOEStatus: COEStatus;
  applicationStatus: ApplicationStatus;
  applicationInstitutionName: string;
  applicationPIRDeniedReason?: string;
  applicationCOEDeniedReason?: string;
}

/**
 * Interface for application summary
 */
export interface ApplicationSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}

/**
 * DTO for Notice of Assessment view
 */
export interface NoticeOfAssessmentDTO {
  assessment: Assessment;
  applicationNumber: string;
  fullName: string;
  programName: string;
  locationName: string;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  msfaaNumber: string;
  disbursement: any;
}

/**
 * DTO for assessment payload.
 * This interface is to provide contract for the assessment payload
 * which is stored to database by workflow.
 * It is possible that more properties can be added to the assessment payload
 * without updating this interface and displayed in NOA form.
 * Whenever there is a source code update, please ensure that properties in this interface are in sync with
 * assessment payload created by camunda workflow.
 */
export interface Assessment {
  weeks: number;
  totalFederalAward: number;
  totalProvincialAward: number;
  federalAssessmentNeed: number;
  provincialAssessmentNeed: number;
  tuitionCost: number;
  booksAndSuppliesCost: number;
  exceptionalEducationCost: number;
  livingAllowance: number;
  transportationCost: number;
  childcareCost: number;
  alimonyOrChildSupport: number;
  secondResidenceCost: number;
  partnerStudentLoanCost: number;
  totalAssessedCost: number;
  studentTotalFederalContribution: number;
  studentTotalProvincialContribution: number;
  partnerAssessedContribution: number;
  parentAssessedContribution: number;
  totalFederalContribution: number;
  totalProvincialContribution: number;
  otherAllowableCost: number;
}

export interface StudentApplicationAndCount {
  applications: ApplicationSummaryDTO[];
  totalApplications: number;
}

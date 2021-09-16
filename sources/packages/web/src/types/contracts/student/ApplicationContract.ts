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
   * The application is in draft state and is not Submitted
   */
  draft = "Draft",
  /**
   * The application has been submitted by the student
   */
  submitted = "Submitted",
  /**
   * The application is submitted and Camunda Worflow has been started.
   * This is an overall state for "gathering required information required for assessment"
   * (Eg. PIR/Income Validation/Spouse Information/Parent Information)
   */
  inProgress = "In Progress",
  /**
   * Camunda Worflow completed the assessment.
   * The NOA has been populated and presented to the student for confirmation
   */
  assessment = "Assessment",
  /**
   * The NOA has been accepted and the institution needs to confirm enrollment
   */
  enrollment = "Enrollment",
  /**
   * The application has been confirmed by the student
   */
  completed = "Completed",
  /**
   * The application has been cancelled by the student.
   * A cancelled Application should never be modified.
   */
  cancelled = "Cancelled",
}

export interface ApplicationStatusToBeUpdatedDto {
  applicationStatus: ApplicationStatus;
}

export interface GetApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
  id: number;
  applicationStatus: ApplicationStatus;
  applicationStatusUpdatedOn: string;
}

export interface ApplicationSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: string;
  fullName: string;
}

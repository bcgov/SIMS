import {
  ProgramInfoStatus,
  COEStatus,
  AssessmentStatus,
  OfferingIntensity,
} from "@/types";

export interface CreateApplicationDraftResult {
  draftAlreadyExists: boolean;
  draftId?: number;
}

/**
 * Possible status of a Student Application.
 * Applications with the same parent ID can have multiple edited versions and only one of its versions
 * should have a status other than 'Edited', which represents its current state.
 * Edited applications waiting for the Ministry approval are not considered 'current' till approved.
 */
export enum ApplicationStatus {
  /**
   * The application is in draft state and is not Submitted.
   */
  Draft = "Draft",
  /**
   * The application has been submitted by the student.
   */
  Submitted = "Submitted",
  /**
   * The application is submitted and Camunda Workflow has been started.
   * This is an overall state for "gathering required information required for assessment"
   * (Eg. PIR/Income Validation/Spouse Information/Parent Information)
   */
  InProgress = "In Progress",
  /**
   * Camunda Workflow completed the assessment.
   * The NOA has been populated and presented to the student for confirmation.
   */
  Assessment = "Assessment",
  /**
   * The NOA has been accepted and the institution needs to confirm enrollment.
   */
  Enrolment = "Enrolment",
  /**
   * The application has been confirmed by the institution.
   */
  Completed = "Completed",
  /**
   * The application has been cancelled by the student.
   */
  Cancelled = "Cancelled",
  /**
   * The application was modified in some way and a new version was created.
   * This can happen when a student edits an application prior to COE confirmation or
   * when a change request is made by the student (after COE approval) and is approved by the Ministry.
   */
  Edited = "Edited",
}

/**
 * Status of the "application edit"(a.k.a. change request) that allows to track the changes and approvals.
 * An application edition can be requested before or after an application is completed, which leads
 * to different paths controlled by this status.
 * If the application is edited before is has its main status set to "Completed" (a.k.a. before COE),
 * the edit can be executed without any Ministry approval.
 * If the application is edited after it has its main status set to "Completed" (a.k.a. after COE),
 * the edit must be approved by the Ministry.
 */
export enum ApplicationEditStatus {
  /**
   * Default status when the application was never edited in any way.
   * This status will likely be associated to draft applications.
   */
  Original = "Original",
  /**
   * Status for applications that are being edited after COE and Ministry approval is needed.
   */
  ChangeInProgress = "Change in progress",
  /**
   * Status for applications that are being edited after COE and Ministry approval
   * was requested and is pending.
   * This status is only applicable to applications that are being edited after COE.
   */
  ChangePendingApproval = "Change pending approval",
  /**
   * Status for applications that are being edited after COE and Ministry declined the edit.
   * This status is only applicable to applications that are being edited after COE.
   */
  ChangeDeclined = "Change declined",
  /**
   * Status for applications the student opted by cancelling a change request prior to the Ministry approval.
   * This status is only applicable to applications that are being edited after COE.
   */
  ChangeCancelled = "Change cancelled",
  /**
   * Status for applications that are being edited after COE and Ministry has approved it.
   * This status is only applicable to applications that are being edited after COE.
   */
  ChangedWithApproval = "Changed with approval",
  /**
   * When the edit was executed and no Ministry approval was needed (a.k.a. edit before COE).
   * This status is only applicable to applications that are being edited before COE.
   */
  Edited = "Edited",
}

/**
 * Possible status of application scholastic standing.
 */
export enum ApplicationScholasticStandingStatus {
  /**
   * Applications that are archived and have a scholastic standing associated with.
   */
  Completed = "Completed",
  /**
   * Applications that are not archived yet and are available to have a change reported (scholastic standing).
   */
  Available = "Available",
  /**
   * Applications that are archived and no longer can have a change reported (scholastic standing).
   */
  Unavailable = "Unavailable",
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
 * Interface for BaseAssessment values that are shared between FullTime and PartTime
 */
export interface BaseAssessment {
  weeks: number;
  tuitionCost: number;
  childcareCost: number;
  transportationCost: number;
  booksAndSuppliesCost: number;
  totalFederalAward: number;
  totalProvincialAward: number;
  totalFamilyIncome: number;
  totalAssessmentNeed: number;
}

/**
 * Interface for FullTime assessment payload.
 */
export interface FullTimeAssessment extends BaseAssessment {
  federalAssessmentNeed: number;
  provincialAssessmentNeed: number;
  exceptionalEducationCost: number;
  livingAllowance: number;
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

/**
 * Interface for PartTime assessment payload.
 */
export interface PartTimeAssessment extends BaseAssessment {
  miscellaneousCost: number;
  totalAcademicExpenses: number;
  // TODO: Mandatory fees could be potentially part of base assessment.
  mandatoryFees: number;
}
/**
 * This is a type which provides the contract for FullTime and PartTime assessment payload
 * which is stored to database by workflow.
 * It is possible that more properties can be added to the assessment payload
 * without updating this interface and displayed in NOA form.
 * Whenever there is a source code update, please ensure that properties in this interface are in sync with
 * assessment payload created by camunda workflow.
 */
export type Assessment = FullTimeAssessment | PartTimeAssessment;

/**
 * Represents the application dynamic data.
 * ! This is a subset of application data properties.
 */
export interface ApplicationData {
  /**
   * Study start date provided by the student when the desired option was not found.
   */
  studystartDate?: string;
  /**
   * Study end date provided by the student when the desired option was not found.
   */
  studyendDate?: string;
  /**
   * Defines if the Student will take a full-time or part-time course.
   */
  howWillYouBeAttendingTheProgram?: OfferingIntensity;
  /**
   *
   * Indicates if the application is submitted for change request.
   */
  isChangeRequestApplication?: boolean;
}

export interface ApplicationDetailHeader {
  applicationNumber: string;
  applicationInstitutionName: string;
  applicationOfferingIntensity: OfferingIntensity;
  applicationStartDate: Date | string;
  applicationEndDate: Date | string;
  data: ApplicationData;
}

export enum SuccessWaitingStatus {
  Success = "Success",
  Waiting = "Waiting",
}

/**
 * Represents the data of student application form.
 */
export type StudentApplicationFormData = {
  applicationOfferingIntensityValue: OfferingIntensity;
} & ApplicationData &
  Record<string, unknown>;

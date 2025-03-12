import {
  ASSESSMENT_DATA,
  ASSESSMENT_ID,
  WORKFLOW_DATA,
} from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationData,
  AssessmentTriggerType,
  SupportingUserType,
  StudyBreaksAndWeeks,
  AssessmentStatus,
  WorkflowData,
  ApplicationStatus,
  ApplicationEditStatus,
} from "@sims/sims-db";

export interface AssociateWorkflowInstanceJobInDTO {
  [ASSESSMENT_ID]: number;
}

export interface AssessmentDataJobInDTO {
  [ASSESSMENT_ID]: number;
}

export interface ProgramYearJobOutDTO {
  programYear: string;
  startDate: string;
  endDate: string;
}

export interface ApplicationOfferingJobOutDTO {
  id: number;
  studyStartDate: string;
  studyEndDate: string;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  offeringIntensity: string;
  courseLoad?: number;
  studyBreaks: StudyBreaksAndWeeks;
}

export interface ApplicationProgramJobOutDTO {
  programCredentialType: string;
  programLength: string;
}

export interface ApplicationInstitutionJobOutDTO {
  institutionType: string;
}

export interface ApplicationLocationJobOutDTO {
  institutionLocationProvince: string;
}

export interface ApplicationStudentJobOutDTO {
  craReportedIncome?: number;
  taxYear?: number;
}

export interface SupportingUserJobOutDTO {
  id: number;
  supportingUserType: SupportingUserType;
  supportingData?: any;
  craReportedIncome?: number;
}

export interface StudentAppealRequestJobOutDTO {
  submittedData: unknown;
}

export interface StudentAppealRequestJobsOutDTO {
  submittedData: unknown;
}

/**
 * Assessment and application information used as a main
 * source of data for assessment workflow process.
 */
export interface ApplicationAssessmentJobOutDTO {
  /**
   * Application associated with this application.
   */
  applicationId: number;
  /**
   * Current status of the application.
   */
  applicationStatus: ApplicationStatus;
  /**
   * Application edit status.
   */
  applicationEditStatus: ApplicationEditStatus;
  /**
   * If any NOA has been approved for the application.
   */
  hasNOAApproval: boolean;
  /**
   * Origin of the assessment.
   */
  triggerType: AssessmentTriggerType;
  /**
   * Application dynamic data.
   */
  data: ApplicationData;
  /**
   * Details of the program year associated with the student application.
   */
  programYear: ProgramYearJobOutDTO;
  /**
   * Offering details for student application.
   */
  offering: ApplicationOfferingJobOutDTO;
  /**
   * Program details for student application.
   */
  program: ApplicationProgramJobOutDTO;
  /**
   * Institution details for student application.
   */
  institution: ApplicationInstitutionJobOutDTO;
  /**
   * Location details for student application.
   */
  location: ApplicationLocationJobOutDTO;
  /**
   * Student details for student application.
   */
  student: ApplicationStudentJobOutDTO;
  /**
   * Supporting users associated with this application.
   */
  supportingUsers: Record<string, SupportingUserJobOutDTO>;
  /**
   * Approved student appeals requests.
   */
  appeals: Record<string, StudentAppealRequestJobsOutDTO>;
}

export interface SaveAssessmentDataJobInDTO {
  [ASSESSMENT_ID]: number;
  [ASSESSMENT_DATA]: unknown;
}

export interface UpdateNOAStatusJobInDTO {
  [ASSESSMENT_ID]: number;
}

export interface UpdateNOAStatusHeaderDTO {
  status: AssessmentStatus;
}

export interface UpdateNOAStatusHeaderDTO {
  status: AssessmentStatus;
}

export interface WorkflowWrapUpJobInDTO {
  [ASSESSMENT_ID]: number;
  [WORKFLOW_DATA]: WorkflowData;
}

/**
 * Provides the status to the workflow that an assessment is the next in order to be processed.
 * When {@link isReadyForCalculation} is true, dynamic properties will also be attached to the
 * response representing the total awards values consumed for the particular student for the
 * application program year.
 */
export type VerifyAssessmentCalculationOrderJobOutDTO = {
  isReadyForCalculation: boolean;
  latestCSLPBalance?: number;
} & Record<string, number>;

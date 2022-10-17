import {
  ASSESSMENT_DATA,
  ASSESSMENT_ID,
} from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationData,
  AssessmentTriggerType,
  SupportingUserType,
  StudyBreaksAndWeeks,
  AssessmentStatus,
} from "@sims/sims-db";

export interface AssessmentDataJobInDTO {
  [ASSESSMENT_ID]: number;
}

export interface ProgramYearJobOutDTO {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

export interface ApplicationOfferingJobOutDTO {
  id: number;
  studyStartDate: Date;
  studyEndDate: Date;
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
  studentPDStatus?: boolean;
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

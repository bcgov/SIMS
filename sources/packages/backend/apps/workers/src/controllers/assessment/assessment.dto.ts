import {
  ApplicationData,
  AssessmentTriggerType,
  SupportingUserType,
  StudyBreaksAndWeeks,
} from "@sims/sims-db";

export interface AssessmentDataWorkerInDTO {
  assessmentId: number;
}

export interface ProgramYearWorkerOutDTO {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

export interface ApplicationOfferingWorkerOutDTO {
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

export interface ApplicationProgramWorkerOutDTO {
  programCredentialType: string;
  programLength: string;
}

export interface ApplicationInstitutionWorkerOutDTO {
  institutionType: string;
}

export interface ApplicationLocationWorkerOutDTO {
  institutionLocationProvince: string;
}

export interface ApplicationStudentWorkerOutDTO {
  studentPDStatus?: boolean;
  craReportedIncome?: number;
  taxYear?: number;
}

export interface SupportingUserWorkerOutDTO {
  id: number;
  supportingUserType: SupportingUserType;
  supportingData?: any;
  craReportedIncome?: number;
}

export interface StudentAppealRequestWorkerOutDTO {
  submittedData: unknown;
}

export interface StudentAppealRequestWorkersOutDTO {
  submittedData: unknown;
}

/**
 * Assessment and application information used as a main
 * source of data for assessment workflow process.
 */
export interface ApplicationAssessmentWorkerOutDTO {
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
  programYear: ProgramYearWorkerOutDTO;
  /**
   * Offering details for student application.
   */
  offering: ApplicationOfferingWorkerOutDTO;
  /**
   * Program details for student application.
   */
  program: ApplicationProgramWorkerOutDTO;
  /**
   * Institution details for student application.
   */
  institution: ApplicationInstitutionWorkerOutDTO;
  /**
   * Location details for student application.
   */
  location: ApplicationLocationWorkerOutDTO;
  /**
   * Student details for student application.
   */
  student: ApplicationStudentWorkerOutDTO;
  /**
   * Supporting users associated with this application.
   */
  supportingUsers: Record<string, SupportingUserWorkerOutDTO>;
  /**
   * Approved student appeals requests.
   */
  appeals: Record<string, StudentAppealRequestWorkersOutDTO>;
}

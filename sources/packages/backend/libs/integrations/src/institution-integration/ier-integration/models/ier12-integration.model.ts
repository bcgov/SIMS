import { DisbursementSchedule } from "@sims/sims-db";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface IER12UploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a IER 12 file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface IER12FileLine {
  getFixedFormat(): string;
}

export interface IER12Record {
  assessmentId: number;
  applicationNumber: string;
  sin: string;
  studentLastName: string;
  studentGivenName: string;
  birthDate: string;
  programName: string;
  programDescription: string;
  credentialType: string;
  cipCode: number;
  nocCode: string;
  sabcCode: string;
  institutionProgramCode: string;
  programLength: number;
  studyStartDate: string;
  studyEndDate: string;
  tuitionFees: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionExpenses: number;
  totalFundedWeeks: number;
  disbursementSchedules: DisbursementSchedule[];
}

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

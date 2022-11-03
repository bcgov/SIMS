import { DisbursementSchedule } from "@sims/sims-db";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface IERUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a IER file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface IERRequestFileLine {
  getFixedFormat(): string;
}

export interface IERRecord {
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
  courseLoad: number;
  offeringIntensity: string;
  disbursementSchedules: DisbursementSchedule[];
}

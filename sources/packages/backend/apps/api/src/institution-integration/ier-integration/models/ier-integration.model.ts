import { DisbursementSchedule } from "@sims/sims-db";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface IERUploadResult {
  generatedFile: string;
  uploadedRecords: number;
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
  cipCode: string;
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
  fundingType: DisbursementSchedule[];
}

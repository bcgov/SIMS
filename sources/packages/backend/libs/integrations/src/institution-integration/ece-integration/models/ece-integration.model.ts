export const ECE_SENT_TITLE = "CONFIRMATION REQUEST";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECEUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a ECE request file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface ECERequestFileLine {
  getFixedFormat(): string;
}

export interface ECERecord {
  institutionCode: string;
  awardDisbursmentIdx: string;
  documentType: string;
  disbursementAmount: string;
  sin: string;
  studentLastName: string;
  studentGivenName: string;
  birthDate: string;
  sfasApplicationNumber: string;
  institutionStudentNumber: string;
  courseLoad: string;
  studyStartDate: string;
  studyEndDate: string;
  disbursementDate: string;
}

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

/**
 * Codes used to start all the lines of the files sent to ECE.
 */
export enum RecordTypeCodes {
  ECEHeader = "1",
  ECEDetail = "2",
  ECETrailer = "3",
}

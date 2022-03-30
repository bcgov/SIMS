import {
  DisbursementValue,
  RelationshipStatus,
} from "../../../database/entities";

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
export const ECERT_SENT_TITLE = "ENTITLEMENT";
export const TIME_FORMAT = "HHmm";

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

export interface ECertRecord {
  sin: string;
  applicationNumber: string;
  documentNumber: number;
  disbursementDate: Date;
  documentProducedDate: Date;
  negotiatedExpiryDate: Date;
  schoolAmount: number;
  educationalStartDate: Date;
  educationalEndDate: Date;
  federalInstitutionCode: string;
  weeksOfStudy: number;
  fieldOfStudy: number;
  yearOfStudy: number;
  completionYears: string;
  enrollmentConfirmationDate: Date;
  dateOfBirth: Date;
  lastName: string;
  firstName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  email: string;
  gender: string;
  maritalStatus: RelationshipStatus;
  studentNumber: string;
  awards: Award[];
}

/**
 * Codes used to start all the lines of the e-Cert
 * files sent to ESDC.
 */
export enum RecordTypeCodes {
  ECertHeader = "100",
  ECertRecord = "200",
  ECertFooter = "999",
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECertUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

export interface CreateRequestFileNameResult {
  fileName: string;
  filePath: string;
}

/**
 * Represents the output of the processing of
 * one E-Cert response file from the. SFTP
 */
export class ProcessSftpResponseResult {
  /**
   * Processing summary for a file.
   */
  processSummary: string[] = [];
  /**
   * Errors found during the processing.
   */
  errorsSummary: string[] = [];
}

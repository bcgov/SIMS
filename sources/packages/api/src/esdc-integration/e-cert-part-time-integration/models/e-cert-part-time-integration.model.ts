import {
  DisbursementValue,
  RelationshipStatus,
} from "../../../database/entities";

export const ECERT_SENT_TITLE = "Entitlement File";
export const CSGD = "CSGD";
export const CSGP = "CSGP";
export const CSGPT = "CSGPT";

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

export interface ECertPTRecord {
  sin: string;
  disbursementDate: Date;
  documentProducedDate: Date;
  educationalStartDate: Date;
  educationalEndDate: Date;
  federalInstitutionCode: string;
  weeksOfStudy: number;
  fieldOfStudy: number;
  yearOfStudy: number;
  enrollmentConfirmationDate: Date;
  dateOfBirth: Date;
  lastName: string;
  firstName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
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
  ECertHeader = "01",
  ECertRecord = "02",
  ECertFooter = "99",
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECertUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

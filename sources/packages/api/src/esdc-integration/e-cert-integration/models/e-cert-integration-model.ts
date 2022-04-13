import {
  DisbursementValue,
  RelationshipStatus,
} from "../../../database/entities";

export const ECERT_SENT_TITLE = "ENTITLEMENT";
export const CSGD = "CSGD";
export const CSGP = "CSGP";
export const CSGPT = "CSGPT";
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
  courseLoad: number;
}

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

/**
 * Codes used to start all the lines of the e-Cert
 * files sent to ESDC.
 */
export enum RecordTypeCodes {
  ECertFullTimeHeader = "100",
  ECertFullTimeRecord = "200",
  ECertFullTimeFooter = "999",
  ECertPartTimeHeader = "01",
  ECertPartTimeRecord = "02",
  ECertPartTimeFooter = "99",
  ECertPartTimeFeedbackHeader = "001",
  ECertPartTimeFeedbackRecord = "002",
  ECertPartTimeFeedbackFooter = "999",
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECertUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

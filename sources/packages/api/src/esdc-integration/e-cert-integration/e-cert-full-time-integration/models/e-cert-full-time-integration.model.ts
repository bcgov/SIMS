import {
  DisbursementValue,
  RelationshipStatus,
} from "../../../../database/entities";

export const ECERT_SENT_TITLE = "ENTITLEMENT";

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

export interface ECertFTRecord {
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

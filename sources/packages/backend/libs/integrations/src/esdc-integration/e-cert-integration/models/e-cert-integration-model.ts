import { DisbursementValue, RelationshipStatus } from "@sims/sims-db";

export const ECERT_SENT_TITLE = "NEW ENTITLEMENT";
export const ECERT_PT_SENT_TITLE = "NEW PT ENTITLEMENT";

/**
 * Amount of Grant for Part-time Studies (CSGP-PT) at the study start.
 */
export const CSPT = "CSPT";
/**
 * Amount of Grant for Students with Permanent Disabilities (CSGP-PD) at the study start.
 */
export const CSGP = "CSGP";
/**
 * Amount Grant for Part-time Students with Dependants (CSGP-PTDEP) at the study start.
 */
export const CSGD = "CSGD";
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
  provinceState: string;
  postalCode: string;
  country: string;
  email: string;
  gender: string;
  maritalStatus: RelationshipStatus;
  studentNumber: string;
  awards: Award[];
  stopFullTimeBCFunding: boolean;
  courseLoad?: number;
  /**
   * Persistent or prolonged disability flag.
   */
  ppdFlag?: boolean;
}

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount" | "effectiveAmount"
>;

/**
 * Codes used to start all the lines of the e-Cert files sent to ESDC
 * and feedback files received with possible e-Cert errors.
 */
export enum RecordTypeCodes {
  ECertFullTimeHeader = "100",
  ECertFullTimeRecord = "200",
  ECertFullTimeFooter = "999",
  ECertPartTimeHeader = "01",
  ECertPartTimeRecord = "02",
  ECertPartTimeFooter = "99",
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECertUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

export interface ESDCFileResponse {
  processSummary: string[];
  errorsSummary: string[];
}

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

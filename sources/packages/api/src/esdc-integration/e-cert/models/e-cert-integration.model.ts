export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
export const ECERT_SENT_TITLE = "ENTITLEMENT";
export const TIME_FORMAT = "HHmm";

export interface GrantAward {
  code: string;
  amount: number;
}

export interface ECertRecord {
  sin: string;
  applicationNumber: string;
  documentNumber: number;
  disbursementDate: Date;
  negotiatedExpiryDate: Date;
  disbursementAmount: number;
  studentAmount: number;
  schoolAmount: number;
  cslAwardAmount: number;
  bcslAwardAmount: number;
  educationalStartDate: Date;
  educationalEndDate: Date;
  federalInstitutionCode: string;
  weeksOfStudy: number;
  fieldOfStudy: number;
  yearOfStudy: number;
  totalYearsOfStudy: number;
  intensityIndicator: string;
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
  maritalStatus: string;
  studentNumber: string;
  totalGrantAmount: number;
  grantAwards: GrantAward[];
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

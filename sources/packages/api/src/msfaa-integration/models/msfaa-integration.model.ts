export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
export const MSFAA_SENT_TITLE = "MSFAA SENT";
export const TIME_FORMAT = "HHmm";
export const MSFAA_SENT_STATUS_CODE = "P";
/**
 * Required information to a
 * MSFAA validation to be processed.
 */
export interface MSFAARecord {
  id: number;
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: Date;
  surname: string;
  givenName: string;
  gender: string;
  maritalStatus: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  offeringIntensity: string;
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface MSFAAUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a MSFAA file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface MSFAARequestFileLine {
  getFixedFormat(): string;
}

/**
 * Codes used to start all the lines of the files sent to MSFAA.
 */
export enum TransactionCodes {
  MSFAARequestHeader = "100",
  MSFAARequestDetail = "200",
  MSFAARequestTrailer = "999",
}

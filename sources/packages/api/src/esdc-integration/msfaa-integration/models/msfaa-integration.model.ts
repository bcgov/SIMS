import { RelationshipStatus } from "../../../database/entities";
import { MSFAAResponseCancelledRecord } from "../msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseReceivedRecord } from "../msfaa-files/msfaa-response-received-record";

export const MSFAA_SENT_TITLE = "MSFAA SENT";
export const MSFAA_SENT_STATUS_CODE = "P";
/**
 * Required information to a
 * MSFAA request to be processed.
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
  maritalStatus: RelationshipStatus;
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
export enum RecordTypeCodes {
  MSFAAHeader = "100",
  MSFAADetail = "200",
  MSFAATrailer = "999",
}

/**
 * Codes used to define if the MSFAA was signed or cancelled/rejected.
 */
export enum ReceivedStatusCode {
  Received = "R",
  Cancelled = "C",
}

/**
 * Represents the parsed content of a file
 * downloaded from the MSFAA SFTP response folder.
 */
export interface MSFAASFTPResponseFile {
  /**
   * File name. Useful for log.
   */
  fileName: string;
  /**
   * Full file path of the file on the SFTP.
   */
  filePath: string;
  /**
   * Response statuses records present on the file.
   */
  receivedRecords: MSFAAResponseReceivedRecord[];
  /**
   * Total records present on the file.
   */
  cancelledRecords: MSFAAResponseCancelledRecord[];
}

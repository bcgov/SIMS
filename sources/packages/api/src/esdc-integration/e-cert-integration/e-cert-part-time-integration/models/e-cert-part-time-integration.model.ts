export const ECERT_SENT_TITLE = "Entitlement File";
export const CSGD = "CSGD";
export const CSGP = "CSGP";
export const CSGPT = "CSGPT";

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

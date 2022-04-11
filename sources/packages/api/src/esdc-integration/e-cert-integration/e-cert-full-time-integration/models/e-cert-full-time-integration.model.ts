export const ECERT_SENT_TITLE = "ENTITLEMENT";

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

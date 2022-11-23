export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
export const TIME_FORMAT = "HHmm";

export interface CreateRequestFileNameResult {
  fileName: string;
  filePath: string;
}

/**
 * Represents the output of the processing of
 * one E-Cert response file from the SFTP.
 */
export class ProcessSFTPResponseResult {
  /**
   * Processing summary for a file.
   */
  processSummary: string[] = [];
  /**
   * Errors found during the processing.
   */
  errorsSummary: string[] = [];
}

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

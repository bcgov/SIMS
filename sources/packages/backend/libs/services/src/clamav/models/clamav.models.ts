export interface ScannedFileInfo {
  uniqueFileName: string;
  virusScanStatus: boolean;
}

/**
 * Creates an error similar to the ClamAV error
 * and allow easier identification while executing
 * the error handling.
 */
export class ClamAVError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export interface VirusScanQueueInDTO {
  uniqueFileName: string;
  fileName: string;
}

export interface VirusScanResult {
  fileProcessed: string;
  isInfected: boolean;
  isServerAvailable: boolean;
}

export interface VirusScanCode {
  isInfected: boolean;
  errorCode: string;
}

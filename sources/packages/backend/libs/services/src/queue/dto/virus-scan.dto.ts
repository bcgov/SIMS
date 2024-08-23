export interface VirusScanQueueInDTO {
  uniqueFileName: string;
  fileName: string;
}

export interface VirusScanResult {
  fileProcessed: string;
  isInfected: boolean;
  serverAvailability: string;
}

export interface VirusScanCode {
  isInfected?: boolean;
  errorCode?: string;
}

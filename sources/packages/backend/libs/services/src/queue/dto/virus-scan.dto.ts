export interface VirusScanQueueInDTO {
  uniqueFileName: string;
  fileName: string;
}

export interface VirusScanResult {
  fileProcessed: string;
  isInfected: boolean;
}

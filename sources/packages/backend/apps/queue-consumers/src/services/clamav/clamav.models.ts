import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";

export interface ScannedFileInfo {
  uniqueFileName: string;
  virusScanStatus: boolean;
}

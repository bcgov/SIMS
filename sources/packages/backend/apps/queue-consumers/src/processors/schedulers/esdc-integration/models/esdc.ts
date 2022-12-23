export interface ESDCFileResult {
  generatedFile: string;
  uploadedRecords: number;
}
export interface ESDCFileResponse {
  processSummary: string[];
  errorsSummary: string[];
}
export interface DailyDisbursementReportQueueInDTO {
  batchRunDate?: string;
}

export interface ProcessResponseQueue {
  processSummary: string[];
  errorsSummary: string[];
}

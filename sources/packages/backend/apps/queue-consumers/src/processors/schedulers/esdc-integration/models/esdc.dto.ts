import { IsDateString, IsOptional } from "class-validator";

export class ESDCFileResult {
  generatedFile: string;
  uploadedRecords: number;
}
export class ESDCFileResponse {
  processSummary: string[];
  errorsSummary: string[];
}

export class DailyDisbursementReportQueueInDTO {
  @IsOptional()
  @IsDateString()
  batchRunDate?: string;
}

export class ProcessResponseQueue {
  processSummary: string[];
  errorsSummary: string[];
}

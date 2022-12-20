import { IsDateString, IsOptional } from "class-validator";

export class ESDCFileResultQueueOutDTO {
  generatedFile: string;
  uploadedRecords: number;
}
export class ESDCFileResponseQueueOutDTO {
  processSummary: string[];
  errorsSummary: string[];
}

export class DailyDisbursementReportQueueInDTO {
  @IsOptional()
  @IsDateString()
  batchRunDate?: string;
}

export class ProcessResponseQueueOutDTO {
  processSummary: string[];
  errorsSummary: string[];
}

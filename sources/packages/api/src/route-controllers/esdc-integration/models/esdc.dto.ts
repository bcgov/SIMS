import { IsDateString, IsOptional } from "class-validator";

export class ESDCFileResultAPIOutDTO {
  generatedFile: string;
  uploadedRecords: number;
}
export class ESDCFileResponseAPIOutDTO {
  processSummary: string[];
  errorsSummary: string[];
}

export class DailyDisbursementReportAPIInDTO {
  @IsOptional()
  @IsDateString()
  batchRunDate?: string;
}

export class ProcessResponseAPIOutDTO {
  processSummary: string[];
  errorsSummary: string[];
}

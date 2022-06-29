import { IsDateString, IsOptional } from "class-validator";

export interface ESDCFileResultDTO {
  generatedFile: string;
  uploadedRecords: number;
}
export interface ESDCFileResponseDTO {
  processSummary: string[];
  errorsSummary: string[];
}

export class DailyDisbursementReportAPIInDTO {
  @IsOptional()
  @IsDateString()
  batchRunDate?: string;
}

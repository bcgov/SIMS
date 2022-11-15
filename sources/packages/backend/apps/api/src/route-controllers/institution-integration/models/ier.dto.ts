import { IsDateString, IsOptional } from "class-validator";

export class IER12ResultAPIOutDTO {
  generatedFile: string;
  uploadedRecords: number;
}

export class GeneratedDateAPIInDTO {
  @IsOptional()
  @IsDateString()
  generatedDate?: string;
}

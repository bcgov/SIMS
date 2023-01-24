import { IsNotEmpty } from "class-validator";
/**
 * Filter param dynamic json.
 */
export class ReportFilterParamAPIInDTO {
  startDate: string;
  endDate: string;
  offeringIntensity: OfferingIntensityDTO;
}

class OfferingIntensityDTO {
  "Full Time": boolean;
  "Part Time": boolean;
}

/**
 * API dto to define the criteria to extract the financial report.
 ** Basic class validators used as dry-run submission will validate payload.
 */
export class ReportsFilterAPIInDTO {
  @IsNotEmpty()
  reportName: string;
  @IsNotEmpty()
  params: ReportFilterParamAPIInDTO;
}

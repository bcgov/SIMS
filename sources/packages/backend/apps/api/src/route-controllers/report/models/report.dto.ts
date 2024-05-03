import { JsonMaxSize } from "../../../utilities/class-validation";
import { Allow, IsEnum, IsNumber, MaxLength } from "class-validator";
import { JSON_10KB, REPORT_NAME_MAX_LENGTH } from "../../../constants";

/**
 * Filter param dynamic json.
 */
export class ReportFilterParamAPIInDTO {
  [columnName: string]: unknown;
}

enum InstitutionReportNames {
  OfferingDetails = "Offering_Details_Report",
  StudentUnmetNeed = "Student_Unmet_Need_Report",
}

enum MinistryReportNames {
  ForecastDisbursements = "Disbursement_Forecast_Report",
  Disbursements = "Disbursement_Report",
  DataInventory = "Data_Inventory_Report",
}

/**
 * API dto to define the criteria to extract the financial report.
 ** Basic class validators used as dry-run submission will validate payload.
 */
export class ReportsFilterAPIInDTO {
  @Allow()
  @JsonMaxSize(JSON_10KB)
  params: ReportFilterParamAPIInDTO;
}

export class InstitutionReportsFilterAPIInDTO extends ReportsFilterAPIInDTO {
  @Allow()
  @MaxLength(REPORT_NAME_MAX_LENGTH)
  @IsEnum(InstitutionReportNames)
  reportName: string;
  @IsNumber()
  programYear: number;
}

export class MinistryReportsFilterAPIInDTO extends ReportsFilterAPIInDTO {
  @Allow()
  @MaxLength(REPORT_NAME_MAX_LENGTH)
  @IsEnum(MinistryReportNames)
  reportName: string;
}

import { JsonMaxSize } from "../../../utilities/class-validation";
import { Allow, IsEnum } from "class-validator";
import { JSON_10KB } from "../../../constants";

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

export enum MinistryReportNames {
  ForecastDisbursements = "Disbursement_Forecast_Report",
  Disbursements = "Disbursement_Report",
  DataInventory = "Data_Inventory_Report",
  ECertErrors = "ECert_Errors_Report",
  InstitutionDesignation = "Institution_Designation_Report",
  StudentUnmetNeed = "Ministry_Student_Unmet_Need_Report",
}

/**
 * API dto to define the criteria to extract the financial report.
 * Basic class validators used as dry-run submission will validate payload.
 */
export abstract class ReportsFilterAPIInDTO {
  @Allow()
  @JsonMaxSize(JSON_10KB)
  params: ReportFilterParamAPIInDTO;
  abstract reportName: string;
}

export class InstitutionReportsFilterAPIInDTO extends ReportsFilterAPIInDTO {
  @IsEnum(InstitutionReportNames)
  reportName: string;
}

export class MinistryReportsFilterAPIInDTO extends ReportsFilterAPIInDTO {
  @IsEnum(MinistryReportNames)
  reportName: string;
}

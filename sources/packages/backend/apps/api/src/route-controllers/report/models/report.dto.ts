import { JsonMaxSize } from "../../../utilities/class-validation";
import { Allow, IsNumber, MaxLength } from "class-validator";
import { JSON_10KB, REPORT_NAME_MAX_LENGTH } from "../../../constants";

/**
 * Filter param dynamic json.
 */
export class ReportFilterParamAPIInDTO {
  [columnName: string]: unknown;
}
/**
 * API dto to define the criteria to extract the financial report.
 ** Basic class validators used as dry-run submission will validate payload.
 */
export class ReportsFilterAPIInDTO {
  @Allow()
  @MaxLength(REPORT_NAME_MAX_LENGTH)
  reportName: string;
  @Allow()
  @JsonMaxSize(JSON_10KB)
  params: ReportFilterParamAPIInDTO;
}

export class InstitutionReportsFilterAPIInDTO extends ReportsFilterAPIInDTO {
  @IsNumber()
  programYear: number;
}

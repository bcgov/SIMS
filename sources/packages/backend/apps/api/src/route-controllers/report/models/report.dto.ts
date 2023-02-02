import { JsonMaxSize } from "../../../utilities/class-validation";
import { Allow, MaxLength } from "class-validator";

const JSON_10KB = 10240;
const REPORT_NAME_MAX_LENGTH = 100;

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

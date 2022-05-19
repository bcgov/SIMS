import { Allow } from "class-validator";

export class ReportFilterParam {
  [columnName: string]: any;
}
/**
 * API dto to define the criteria to extract the financial report.
 ** Basic class validators used as dry-run submission will validate payload.
 */
export class ReportsFilterAPIInDTO {
  @Allow()
  reportName: string;
  @Allow()
  params: ReportFilterParam;
}

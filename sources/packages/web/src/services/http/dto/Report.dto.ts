/**
 * Filter param dynamic json.
 */
export class ReportFilterParamAPIInDTO {
  [propertyName: string]: any;
}
/**
 * API dto to define the criteria to extract the financial report.
 */
export interface ReportsFilterAPIInDTO {
  reportName: string;
  params: ReportFilterParamAPIInDTO;
}

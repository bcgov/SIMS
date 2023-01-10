/**
 * Filter param dynamic json.
 */
export interface ReportFilterParamAPIInDTO {
  [propertyName: string]: unknown;
}
/**
 * API dto to define the criteria to extract the financial report.
 */
export interface ReportsFilterAPIInDTO {
  reportName: string;
  params: ReportFilterParamAPIInDTO;
}

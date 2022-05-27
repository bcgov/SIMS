export interface ReportFilterParam {
  [columnName: string]: any;
}
export interface ReportsFilterModel {
  reportName: string;
  params: ReportFilterParam;
}

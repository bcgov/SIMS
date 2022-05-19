export interface reportFilterParam {
  [columnName: string]: any;
}
export interface ReportsFilterModel {
  reportName: string;
  params: reportFilterParam;
}

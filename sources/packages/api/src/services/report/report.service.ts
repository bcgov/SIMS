import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { ReportConfig } from "../../database/entities";
import { CustomNamedError } from "../../utilities";
import { ReportsFilterModel } from "./report.models";
import { StringBuilder } from "../../utilities/string-builder";
import { REPORT_CONFIG_NOT_FOUND, FILTER_PARAMS_MISMATCH } from "./constants";
/**
 * Service layer for reports.
 */
@Injectable()
export class ReportService extends RecordDataModelService<ReportConfig> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(ReportConfig));
  }

  /**
   * Extract the raw data through the dynamic query retrieved from reports config
   * and translate the dynamic query with arguments built using filter param payload.
   * Build the CSV String with the raw data returned.
   * @param filter filter data for report from payload.
   * @returns report raw data.
   */
  async getReportDataAsCSV(filter: ReportsFilterModel): Promise<string> {
    const parameters = [];
    const filterParams = filter.params;
    const config = await this.getConfig(filter.reportName);
    if (!config) {
      throw new CustomNamedError(
        `The report config is missing for the report ${filter.reportName}.`,
        REPORT_CONFIG_NOT_FOUND,
      );
    }
    let reportQuery = config.reportSQL;

    //Search for params sent from payload in the query. They must be available in the query in :<param_name> pattern.
    //If a param is not found throw error as filter params payload is expected to match the query.
    Object.keys(filterParams).forEach((key, index) => {
      const doesParamExist = reportQuery.includes(`:${key}`);
      if (!doesParamExist) {
        throw new CustomNamedError(
          `The filter param(s) passed for the report ${filter.reportName} does not match the argument(s) in report sql.`,
          FILTER_PARAMS_MISMATCH,
        );
      }
      if (doesParamExist) {
        const regExp = new RegExp(`:${key}`, "g");
        reportQuery = reportQuery.replace(regExp, `$${index + 1}`);
        parameters.push(this.convertFilterDataAsParameter(filterParams[key]));
      }
    });
    const reportData = await this.connection.query(reportQuery, parameters);
    return this.buildCSVString(reportData);
  }

  /**
   * When a filter param value is of type object
   * then convert the object to string array to be able to pass as query argument.
   * Otherwise return the value.
   * @param filterParam the param of payload which is converted to
   * query argument.
   * @returns filter param value for query.
   */
  private convertFilterDataAsParameter(
    filterParam: any,
  ): Date | string | string[] {
    if (
      Array.isArray(filterParam) ||
      filterParam instanceof Date ||
      typeof filterParam !== "object"
    ) {
      return filterParam;
    }
    const paramValue = [];
    Object.keys(filterParam).forEach((key) => {
      if (filterParam[key]) {
        paramValue.push(key);
      }
    });
    return paramValue;
  }

  /**
   * Retrieve the report config of a given report.
   * @param reportName name of the report.
   * @returns report config.
   */
  private async getConfig(reportName: string): Promise<ReportConfig> {
    return this.repo.findOne({ reportName: reportName });
  }

  /**
   * Build CSV string from a dynamic object array.
   * @param reportData
   * @returns CSV string.
   */
  private buildCSVString(reportData: any[]): string {
    if (!reportData || reportData.length === 0) {
      return "No data found.";
    }
    //The report data as array of dynamic object is transformed into CSV string content to
    //to be streamed as CSV file. Keys of first array item used to form the header line of CSV string.
    const reportCSVContent = new StringBuilder();
    const reportHeaders = Object.keys(reportData[0]);
    reportCSVContent.appendLine(reportHeaders.join(","));
    reportData.forEach((reportDataItem) => {
      let dataItem = "";
      reportHeaders.forEach((header, index) => {
        dataItem += index
          ? `,${reportDataItem[header]}`
          : reportDataItem[header];
      });
      reportCSVContent.appendLine(dataItem);
    });
    return reportCSVContent.toString();
  }
}

import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService, ReportConfig } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { ReportsFilterModel } from "./report.models";
import { REPORT_CONFIG_NOT_FOUND, FILTER_PARAMS_MISMATCH } from "./constants";
import { unparse } from "papaparse";

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
      console.log("Param", key);
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
    return unparse(reportData);
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
    return this.repo.findOne({ where: { reportName: reportName } });
  }
}

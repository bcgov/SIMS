import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { ReportConfig } from "../../database/entities";
import { CustomNamedError } from "../../utilities";
import { ReportsFilterModel } from "./report.models";
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
   * @param filter filter data for report from payload.
   * @returns report raw data.
   */
  async getReportData(filter: ReportsFilterModel): Promise<any[]> {
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
        reportQuery = reportQuery.replace(`:${key}`, `$${index + 1}`);
        parameters.push(this.convertFilterDataAsParameter(filterParams[key]));
      }
    });
    return this.connection.query(reportQuery, parameters);
  }

  /**
   * When a filter param value is of type object
   * then convert the object to string array to be able to pass as query argument.
   * Otherwise return the value.
   * @param filterParam the param of payload which is converted to
   * query argument.
   * @returns filter param value for query.
   */
  private convertFilterDataAsParameter(filterParam: any): string | string[] {
    if (Array.isArray(filterParam) || typeof filterParam !== "object") {
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
}

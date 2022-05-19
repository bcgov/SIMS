import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { ReportsFilterModel } from "./report.models";
import { ReportConfig } from "../../database/entities";

/**
 * Service layer for reports.
 */
@Injectable()
export class ReportService extends RecordDataModelService<ReportConfig> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(ReportConfig));
  }

  async exportFinancialReport(filter: ReportsFilterModel): Promise<any[]> {
    const parameters = [];
    const filterParams = filter.params;
    const config = await this.getConfig(filter.reportName);
    let reportQuery = config.reportSQL;

    Object.keys(filterParams).forEach((key, index) => {
      const doesParamExist = reportQuery.includes(`:${key}`);
      if (doesParamExist) {
        reportQuery = reportQuery.replace(`:${key}`, `$${index + 1}`);
        parameters.push(this.convertJSONToArray(filterParams[key]));
      }
    });
    return this.connection.query(reportQuery, parameters);
  }

  private convertJSONToArray(filterParam: any): string | string[] {
    if (Array.isArray(filterParam) || typeof filterParam !== "object") {
      return filterParam;
    }
    const paramValue = [];
    //Convert the json object returned by select boxes of form.io component to an array.
    Object.keys(filterParam).forEach((key) => {
      if (filterParam[key]) {
        paramValue.push(key);
      }
    });
    return paramValue;
  }

  private async getConfig(reportName: string): Promise<ReportConfig> {
    return this.repo.findOne({ reportName: reportName });
  }
}

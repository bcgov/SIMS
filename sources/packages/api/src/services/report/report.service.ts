import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { ReportsFilterModel } from "./report.models";

/**
 * Service layer for reports.
 */
@Injectable()
export class ReportService {
  constructor(private readonly connection: Connection) {}

  async exportFinancialReport(filter: ReportsFilterModel): Promise<any[]> {
    const parameters = [];
    const filterParams = filter.params;

    let reportQuery =
      "select ds.disbursement_date, dv.value_code, sum(dv.value_amount), count(ap.id)  from sims.disbursement_schedules ds " +
      "inner join sims.student_assessments sa on ds.student_assessment_id = sa.id " +
      "inner join sims.applications ap on sa.id = ap.current_assessment_id " +
      "inner join sims.education_programs_offerings epo on sa.offering_id = epo.id " +
      "inner join sims.disbursement_values dv on dv.disbursement_schedule_id = ds.id " +
      "where epo.offering_intensity = ANY(:offeringIntensity) " +
      "and ds.disbursement_date between :startDate and :endDate " +
      "group by ds.disbursement_date, dv.value_code order by ds.disbursement_date";

    Object.keys(filterParams).forEach((key, index) => {
      const doesParamExist = reportQuery.includes(`:${key}`);
      if (doesParamExist) {
        reportQuery = reportQuery.replace(`:${key}`, `$${index + 1}`);
        parameters.push(this.extractFilterParamValue(filterParams[key]));
      }
    });
    return this.connection.query(reportQuery, parameters);
  }

  private extractFilterParamValue(filterParam: any): string | string[] {
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
}

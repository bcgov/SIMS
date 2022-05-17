import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";

/**
 * Service layer for reports.
 */
@Injectable()
export class ReportService {
  constructor(private readonly connection: Connection) {}

  async getReportData(): Promise<any[]> {
    return this.connection.query(
      "select first_name as FirstName from sims.users where is_active = @is_active",
      [false],
    );
  }
}

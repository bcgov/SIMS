import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Update the disbursement reports to include the "Forecast Date" column.
 */
export class UpdateDisbursementReportForecastDate1767653404966 implements MigrationInterface {
  /**
   * Update the disbursement reports to include the "Forecast Date" column.
   * @param queryRunner
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-disbursements-report-forecast-date.sql",
        "Reports",
      ),
    );
  }

  /**
   * Rollback the disbursement reports update that included the "Forecast Date" column.
   * @param queryRunner
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursements-report-forecast-date.sql",
        "Reports",
      ),
    );
  }
}

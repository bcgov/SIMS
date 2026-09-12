import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ReportsCreateMinistryDisabilityAdjudicationSummary1787787460507 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-ministry-disability-adjudication-summary-report.sql",
        "Reports",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-ministry-disability-adjudication-summary-report.sql",
        "Reports",
      ),
    );
  }
}

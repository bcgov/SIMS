import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ReportsCreateMinistryRestrictionCategories1793898007413 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-ministry-restriction-categories-report.sql",
        "Reports",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-ministry-restriction-categories-report.sql",
        "Reports",
      ),
    );
  }
}

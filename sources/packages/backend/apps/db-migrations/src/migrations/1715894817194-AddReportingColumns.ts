import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddReportingColumns1715894817194 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-previous-date-changed-reported-assessment-id-col.sql",
        "StudentAssessments",
      ),
    );

    await queryRunner.query(
      getSQLFileData("Add-reported-date-col.sql", "StudentAssessments"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-previous-date-changed-reported-assessment-id-col.sql",
        "StudentAssessments",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-reported-date-col.sql",
        "StudentAssessments",
      ),
    );
  }
}

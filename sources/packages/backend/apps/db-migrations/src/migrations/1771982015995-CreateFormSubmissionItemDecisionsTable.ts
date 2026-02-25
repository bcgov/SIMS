import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateFormSubmissionItemDecisionsTable1771982015995 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-form-submission-item-decisions-table.sql",
        "FormSubmissionItemDecisions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-form-submission-items-table.sql",
        "FormSubmissionItemDecisions",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AlterFormSubmissionItemsTableForDecisionsHistory1771982089326 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-form-submission-items-table-for-decisions-history.sql",
        "FormSubmissionItems",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-form-submission-items-table-for-decisions-history.sql",
        "FormSubmissionItems",
      ),
    );
  }
}

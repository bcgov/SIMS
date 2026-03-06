import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class StudentsAddModifiedIndependentFormSubmissionItem1772402139831 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-modified-independent-form-submission-item-id.sql",
        "Student",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-modified-independent-form-submission-item-id.sql",
        "Student",
      ),
    );
  }
}

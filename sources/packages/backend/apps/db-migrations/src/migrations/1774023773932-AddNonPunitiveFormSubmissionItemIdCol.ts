import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddAppealConversionRecords1772752698502 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-non-punitive-form-submission-item-id-col.sql",
        "FormSubmissionItems",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-non-punitive-form-submission-item-id-col.sql",
        "FormSubmissionItems",
      ),
    );
  }
}

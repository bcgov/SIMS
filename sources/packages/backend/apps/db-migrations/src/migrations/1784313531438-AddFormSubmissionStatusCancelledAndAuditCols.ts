import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddFormSubmissionStatusCancelledAndAuditCols1784313531438 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new enum value cancelled for form submission status.
    await queryRunner.query(
      getSQLFileData("Add-form-submission-status-cancelled.sql", "Types"),
    );
    // Add the audit columns for form submission status.
    await queryRunner.query(
      getSQLFileData("Add-submission-status-audit-cols.sql", "FormSubmissions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback the audit columns for form submission status.
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-submission-status-audit-cols.sql",
        "FormSubmissions",
      ),
    );
    // Rollback the new enum value cancelled for form submission status.
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-form-submission-status-cancelled.sql",
        "Types",
      ),
    );
  }
}

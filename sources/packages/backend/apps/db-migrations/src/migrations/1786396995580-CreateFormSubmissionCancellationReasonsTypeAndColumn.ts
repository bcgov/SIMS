import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateFormSubmissionCancellationReasonsTypeAndColumn1786396995580 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the new enum type for form submission cancellation reasons.
    await queryRunner.query(
      getSQLFileData(
        "Create-form-submission-cancellation-reasons.sql",
        "Types",
      ),
    );
    // Add new column for cancellation reason.
    await queryRunner.query(
      getSQLFileData("Add-cancellation-reason.sql", "FormSubmissions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback the new column for cancellation reason.
    await queryRunner.query(
      getSQLFileData("Rollback-add-cancellation-reason.sql", "FormSubmissions"),
    );
    // Rollback the new enum type for form submission cancellation reasons.
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-form-submission-cancellation-reasons.sql",
        "Types",
      ),
    );
  }
}

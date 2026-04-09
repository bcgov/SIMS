import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ConvertStudentAppealsToFormSubmissions1775687162365 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Convert-appeals-to-form-submissions.sql",
        "FormSubmissions",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Convert-appeals-requests-to-form-submission-items.sql",
        "FormSubmissionItems",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Convert-non-pending-appeals-requests-to-form-submission-item-decisions.sql",
        "FormSubmissionItemDecisions",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Convert-student-appeal-id-to-form-submission-id.sql",
        "StudentAssessments",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Convert-modified-independent-appeal-to-form-submission-id.sql",
        "Student",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-convert-modified-independent-appeal-to-form-submission-id.sql",
        "Student",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-convert-student-appeal-id-to-form-submission-id.sql",
        "StudentAssessments",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-convert-non-pending-appeals-requests-to-form-submission-item-decisions.sql",
        "FormSubmissionItemDecisions",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-convert-appeals-requests-to-form-submission-items.sql",
        "FormSubmissionItems",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-convert-appeals-to-form-submissions.sql",
        "FormSubmissions",
      ),
    );
  }
}

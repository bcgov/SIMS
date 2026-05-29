import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStudentAssessmentNOAApprovalStatusUpdatedOn1779225341497 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-noa-approval-status-updated-on.sql",
        "StudentAssessments",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-noa-approval-status-updated-on.sql",
        "StudentAssessments",
      ),
    );
  }
}

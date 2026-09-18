import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateBatchReassessment1789764575261 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-batch-reassessment.sql", "BatchReassessments"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-batch-reassessment-applications.sql",
        "BatchReassessmentApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-batch-reassessment-applications.sql",
        "BatchReassessmentApplications",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-batch-reassessment.sql",
        "BatchReassessments",
      ),
    );
  }
}

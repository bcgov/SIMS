import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigInsertFTCanadaStudentGrantEligibilityAppeal1777315165904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-ft-canada-student-grant-eligibility-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-ft-canada-student-grant-eligibility-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

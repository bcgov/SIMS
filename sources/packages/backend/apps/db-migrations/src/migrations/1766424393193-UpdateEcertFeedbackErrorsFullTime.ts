import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateEcertFeedbackErrorsFullTime1766424393193
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-ecert-feedback-errors-full-time.sql",
        "ECertFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-ecert-feedback-errors-full-time.sql",
        "ECertFeedbackErrors",
      ),
    );
  }
}

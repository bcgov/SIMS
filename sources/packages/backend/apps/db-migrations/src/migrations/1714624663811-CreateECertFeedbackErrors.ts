import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateECertFeedbackErrors1714624663811
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-ecert-feedback-errors-table.sql",
        "ECertFeedbackErrors",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Insert-ecert-feedback-errors-full-time.sql",
        "ECertFeedbackErrors",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Insert-ecert-feedback-errors-part-time.sql",
        "ECertFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-ecert-feedback-errors-table.sql",
        "ECertFeedbackErrors",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddECertFeedbackErrorIdColumn1714625235969
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-column-ecert-feedback-error-id.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-column-ecert-feedback-error-id.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }
}

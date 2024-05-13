import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddFeedbackFileNameColumn1715616156014
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-column-feedback-file-name.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-column-feedback-file-name.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }
}

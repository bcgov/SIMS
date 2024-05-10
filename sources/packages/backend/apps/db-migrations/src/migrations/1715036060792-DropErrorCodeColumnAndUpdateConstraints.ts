import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DropErrorCodeColumnAndUpdateConstraints1715036060792
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-column-error-code-and-update-constraint.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-drop-column-error-code-and-update-constraint.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateDisbursementFeedbackErrorsResponse1637873486168
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-disbursement-feedback-errors-table.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-disbursement-feedback-errors-table.sql",
        "DisbursementFeedbackErrors",
      ),
    );
  }
}

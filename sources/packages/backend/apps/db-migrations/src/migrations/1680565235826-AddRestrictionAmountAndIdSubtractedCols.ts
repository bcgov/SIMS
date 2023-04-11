import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddRestrictionAmountAndIdSubtractedCols1680565235826
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-restriction-amount-and-id-subtracted-cols.sql",
        "DisbursementValues",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-restriction-amount-and-id-subtracted-cols.sql",
        "DisbursementValues",
      ),
    );
  }
}

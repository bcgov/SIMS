import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class DisbursementReceiptAddGrantCols1655737375789
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-grant-amount-cols.sql", "DisbursementReceipts"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-grant-amount-cols.sql", "DisbursementReceipts"),
    );
  }
}

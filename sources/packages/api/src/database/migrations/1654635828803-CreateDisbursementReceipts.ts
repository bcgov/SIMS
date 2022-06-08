import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";
export class CreateDisbursementReceipts1654635828803
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-disbursement-receipts-table.sql",
        "DisbursementReceipts",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-disbursement-receipts-table.sql",
        "DisbursementReceipts",
      ),
    );
  }
}

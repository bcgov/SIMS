import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateDisbursementReceiptsColumnsComments1709249786990
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-disbursement-receipts-columns-comments.sql",
        "DisbursementReceipts",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursement-receipts-columns-comments.sql",
        "DisbursementReceipts",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddFileDateAndSequenceNumberColumnsToDisbursementReceipts1717182261632
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-file-date-and-sequence-number-cols.sql",
        "DisbursementReceipts",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-add-file-date-and-sequence-number-cols.sql",
        "DisbursementReceipts",
      ),
    );
  }
}

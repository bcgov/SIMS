import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateCASInvoiceBatchesTable1737512385624
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-cas-invoice-batches.sql", "CASInvoiceBatches"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-cas-invoice-batches.sql",
        "CASInvoiceBatches",
      ),
    );
  }
}

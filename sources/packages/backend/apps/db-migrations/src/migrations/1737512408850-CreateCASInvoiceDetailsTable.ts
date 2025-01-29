import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateCASInvoiceDetailsTable1737512408850
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-cas-invoice-details.sql", "CASInvoiceDetails"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-cas-invoice-details.sql",
        "CASInvoiceDetails",
      ),
    );
  }
}

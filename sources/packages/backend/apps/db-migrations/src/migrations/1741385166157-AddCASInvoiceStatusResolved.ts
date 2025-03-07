import { getSQLFileData } from "@sims/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCASInvoiceStatusResolved1741385166157
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-cas-invoice-status-resolved.sql", "Types"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-cas-invoice-status-resolved.sql", "Types"),
    );
  }
}

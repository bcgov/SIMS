import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddCASInvoiceStatusUpdatedByColumn1741646122852
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-cas-invoice-status-updated-by-column.sql",
        "CASInvoices",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-cas-invoice-status-updated-by-column.sql",
        "CASInvoices",
      ),
    );
  }
}

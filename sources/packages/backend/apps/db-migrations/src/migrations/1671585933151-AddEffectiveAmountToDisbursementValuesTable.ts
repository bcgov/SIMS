import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddEffectiveAmountToDisbursementValuesTable1671585933151
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-effective-amount-col.sql", "DisbursementValues"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-effective-amount-col.sql", "DisbursementValues"),
    );
  }
}

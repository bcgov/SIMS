import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DisbursementValuesAlterValueAmountNotNullable1759873240560
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-value-amount-not-nullable.sql",
        "DisbursementValues",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-value-amount-not-nullable.sql",
        "DisbursementValues",
      ),
    );
  }
}

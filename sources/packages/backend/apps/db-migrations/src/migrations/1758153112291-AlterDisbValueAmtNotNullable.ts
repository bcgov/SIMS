import { getSQLFileData } from "@sims/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterDisbValueAmtNotNullable1758153112291
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-null-value-amount-records.sql",
        "DisbursementValues",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Alter-value-amount-not-nullable.sql",
        "DisbursementValues",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Alter-value-amount-nullable.sql", "DisbursementValues"),
    );
  }
}

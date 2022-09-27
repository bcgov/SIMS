import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class DisbursementAddCOEDeniedColumns1644205709507
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-coe-denied-cols.sql", "DisbursementSchedules"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-coe-denied-cols.sql", "DisbursementSchedules"),
    );
  }
}

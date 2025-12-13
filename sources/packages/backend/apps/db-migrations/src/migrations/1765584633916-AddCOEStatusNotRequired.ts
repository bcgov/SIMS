import { getSQLFileData } from "../utilities/sqlLoader";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCOEStatusNotRequired1765584633916
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-coe-status-not-required.sql", "Types"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-coe-status-not-required.sql", "Types"),
    );
  }
}

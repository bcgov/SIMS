import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class SwapCSLOverawardColumnsForSFASIndividuals1736876400977
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-swap-csl-bcsl-columns.sql", "SFASIndividuals"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-swap-csl-bcsl-columns.sql",
        "SFASIndividuals",
      ),
    );
  }
}

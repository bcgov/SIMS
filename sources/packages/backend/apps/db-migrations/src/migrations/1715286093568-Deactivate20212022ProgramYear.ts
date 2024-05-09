import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class Deactivate20212022ProgramYear1715286093568
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Deactivate-program-year-2021-2022.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-deactivate-program-year-2021-2022.sql",
        "ProgramYear",
      ),
    );
  }
}

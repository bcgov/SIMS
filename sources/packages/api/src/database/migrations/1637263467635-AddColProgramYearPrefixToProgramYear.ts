import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddColProgramYearPrefixToProgramYear1637263467635
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-program-year-prefix.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-program-year-prefix.sql", "ProgramYear"),
    );
  }
}

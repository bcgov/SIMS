import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddProgramYearStartEndDates1632431148930
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-start-end-dates copy.sql", "ProgramYear"),
    );

    await queryRunner.query(
      getSQLFileData("Update-initial-program-year.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-start-end-dates.sql", "ProgramYear"),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateEducationProgramsConfigurations2027_281793395451974 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-program-year-2027-2028.sql", "ProgramYear"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-education-programs-configurations-2027-2028.sql",
        "EducationProgramsConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-education-programs-configurations-2027-2028.sql",
        "EducationProgramsConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-program-year-2027-2028.sql",
        "ProgramYear",
      ),
    );
  }
}

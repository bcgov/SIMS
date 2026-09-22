import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class EnableProgramsConfigurations1790035023742 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-education-programs-configurations-table.sql",
        "EducationProgramsConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Add-program-configurations-columns.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-program-configurations-columns.sql",
        "EducationPrograms",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-education-programs-configurations-table.sql",
        "EducationProgramsConfigurations",
      ),
    );
  }
}

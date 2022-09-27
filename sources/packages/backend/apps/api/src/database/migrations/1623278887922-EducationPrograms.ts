import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "EducationPrograms";

export class EducationPrograms1623278887922 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-education-programs.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-education-programs.sql", DIR));
  }
}

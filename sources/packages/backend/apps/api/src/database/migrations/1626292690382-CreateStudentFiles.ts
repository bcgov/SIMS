import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "StudentFiles";

export class CreateStudentFiles1626292690382 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Create-student-files.sql", DIR));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-student-files.sql", DIR));
  }
}

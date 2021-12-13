import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";
export class CreateNotes1638933119440 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Create-notes.sql", "Notes"));

    await queryRunner.query(
      getSQLFileData("Create-student-notes.sql", "Notes"),
    );
    await queryRunner.query(
      getSQLFileData("Create-institution-notes.sql", "Notes"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-student-notes.sql", "Notes"));
    await queryRunner.query(
      getSQLFileData("Drop-institution-notes.sql", "Notes"),
    );
    await queryRunner.query(getSQLFileData("Drop-notes.sql", "Notes"));
  }
}

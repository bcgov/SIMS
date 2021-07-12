import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class ProgramYear1626109515157 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-program-year.sql", "ProgramYear"),
    );

    // Loading initial values
    await queryRunner.query(
      getSQLFileData("Create-initial-program-year.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-program-year.sql", "ProgramYear"),
    );
  }
}

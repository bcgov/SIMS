import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../../utilities";

export class SetupArchiveDB1614276279416 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("SetupDB.sql", "ArchiveDB"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("TearDownDB.sql", "ArchiveDB"));
  }

}

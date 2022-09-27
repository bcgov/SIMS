import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "SequenceControl";

export class SequenceControl1621557382034 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Create-SequenceControl.sql", DIR));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-SequenceControl.sql", DIR));
  }
}

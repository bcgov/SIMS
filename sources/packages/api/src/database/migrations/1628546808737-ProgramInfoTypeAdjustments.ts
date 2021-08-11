import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "Types";

export class ProgramInfoTypeAdjustments1628546808737
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("alter-program-info-status.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("rollbak-program-info-status.sql", DIR),
    );
  }
}

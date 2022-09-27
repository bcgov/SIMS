import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AdjustUsersIndexes1635298118746 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Adjust-user-indexes.sql", "User"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-adjust-user-indexes.sql", "User"),
    );
  }
}

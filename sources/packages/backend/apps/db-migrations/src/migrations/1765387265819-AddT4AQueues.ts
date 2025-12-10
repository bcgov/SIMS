import { getSQLFileData } from "../utilities/sqlLoader";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddT4AQueues1765387265819 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Add-t4a-queues.sql", "Queue"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-t4a-queues.sql", "Queue"),
    );
  }
}

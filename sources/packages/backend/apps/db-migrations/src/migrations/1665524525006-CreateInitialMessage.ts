import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateInitialMessage1665524525006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-initial-messages.sql", "Messages"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

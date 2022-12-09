import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class QueueConfiguration1670270324759 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-queue-configurations.sql", "Queue"),
    );

    // Loading values.
    await queryRunner.query(
      getSQLFileData("Add-queue-configurations-values.sql", "Queue"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-queue-configurations.sql", "Queue"),
    );
  }
}

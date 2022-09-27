import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class PIRDeniedReason1630083600137 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-pir-denied-reason.sql", "PIRDeniedReason"),
    );

    // Loading initial values
    await queryRunner.query(
      getSQLFileData("Create-initial-pir-denied-reason.sql", "PIRDeniedReason"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-pir-denied-reason.sql", "PIRDeniedReason"),
    );
  }
}

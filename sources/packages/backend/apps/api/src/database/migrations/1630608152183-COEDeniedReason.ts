import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class COEDeniedReason1630608152183 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-coe-denied-reason.sql", "COEDeniedReason"),
    );

    // Loading initial values
    await queryRunner.query(
      getSQLFileData("Create-initial-coe-denied-reason.sql", "COEDeniedReason"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-coe-denied-reason.sql", "COEDeniedReason"),
    );
  }
}

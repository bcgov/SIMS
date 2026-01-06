import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddChangeIntensityCOEDeniedReason1766516651982 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-change-intensity-coe-denied-reason.sql",
        "COEDeniedReason",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-change-intensity-coe-denied-reason.sql",
        "COEDeniedReason",
      ),
    );
  }
}

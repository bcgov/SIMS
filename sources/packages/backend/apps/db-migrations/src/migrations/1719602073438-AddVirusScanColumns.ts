import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddVirusScanColumns1719602073438 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-virus-scan-status.sql", "Types"),
    );
    await queryRunner.query(
      getSQLFileData("Add-virus-scan-columns.sql", "StudentFiles"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-virus-scan-columns.sql", "StudentFiles"),
    );
    await queryRunner.query(
      getSQLFileData("Rollback-create-virus-scan-status.sql", "Types"),
    );
  }
}

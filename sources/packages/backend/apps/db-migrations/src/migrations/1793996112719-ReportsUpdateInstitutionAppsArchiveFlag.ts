import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ReportsUpdateInstitutionAppsArchiveFlag1793996112719 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-institution-applications-archive-flag.sql",
        "Reports",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-institution-applications-archive-flag.sql",
        "Reports",
      ),
    );
  }
}

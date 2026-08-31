import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class NotificationsPrepareTableForBCNotifyMigration1788134400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Prepare-table-for-BC-Notify-migration.sql",
        "Notifications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-prepare-table-for-BC-Notify-migration.sql",
        "Notifications",
      ),
    );
  }
}

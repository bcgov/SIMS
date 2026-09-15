import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class NotificationsChangesForRateLimiting1789425630781 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-process-notifications-queue-configuration.sql",
        "Queue",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Add-notification-date-sent-indexes.sql", "Notifications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-process-notifications-queue-configuration.sql",
        "Queue",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-notification-date-sent-indexes.sql",
        "Notifications",
      ),
    );
  }
}

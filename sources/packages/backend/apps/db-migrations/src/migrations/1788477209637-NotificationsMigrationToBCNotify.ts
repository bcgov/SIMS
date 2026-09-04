import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class NotificationsMigrationToBCNotify1788477209637 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Prepare-notifications-for-bc-notify-migration.sql",
        "Notifications",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Prepare-notification-messages-for-bc-notify-migration.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-prepare-notification-messages-for-bc-notify-migration.sql",
        "NotificationMessages",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-prepare-notifications-for-bc-notify-migration.sql",
        "Notifications",
      ),
    );
  }
}

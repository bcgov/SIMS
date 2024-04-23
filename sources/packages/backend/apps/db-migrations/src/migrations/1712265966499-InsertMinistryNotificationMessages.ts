import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertMinistryNotificationMessages1712265966499
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-ministry-notification-messages.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-ministry-notification-messages.sql",
        "NotificationMessages",
      ),
    );
  }
}

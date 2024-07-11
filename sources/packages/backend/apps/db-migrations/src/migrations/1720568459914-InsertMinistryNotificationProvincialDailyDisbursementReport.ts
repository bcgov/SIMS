import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertMinistryNotificationProvincialDailyDisbursementReport1720568459914
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-ministry-notification-provincial-daily-disbursement-report.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-ministry-notification-provincial-daily-disbursement-report.sql",
        "NotificationMessages",
      ),
    );
  }
}

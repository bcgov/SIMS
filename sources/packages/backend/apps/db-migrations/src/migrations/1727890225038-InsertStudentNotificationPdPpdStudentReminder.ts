import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertStudentNotificationPdPpdStudentReminder1727890225038
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-student-notification-pd-ppd-student-reminder.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-Insert-student-notification-pd-ppd-student-reminder.sql",
        "NotificationMessages",
      ),
    );
  }
}

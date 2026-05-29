import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertStudentNotificationAssessmentReminder1778884112093 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-student-notification-assessment-reminder.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-student-notification-assessment-reminder.sql",
        "NotificationMessages",
      ),
    );
  }
}

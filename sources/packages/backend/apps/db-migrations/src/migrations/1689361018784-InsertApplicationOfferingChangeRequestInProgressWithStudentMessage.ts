import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertApplicationOfferingChangeRequestInProgressWithStudentMessage1689361018784
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-application-offering-change-request-inprogress-with-student-message.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-application-offering-change-request-inprogress-with-student-message.sql",
        "NotificationMessages",
      ),
    );
  }
}

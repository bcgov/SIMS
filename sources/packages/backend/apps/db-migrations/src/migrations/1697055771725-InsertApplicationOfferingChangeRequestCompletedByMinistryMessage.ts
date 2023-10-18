import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertApplicationOfferingChangeRequestCompletedByMinistryMessage1697055771725
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-application-offering-change-request-completed-by-ministry-message.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-application-offering-change-request-completed-by-ministry-message.sql",
        "NotificationMessages",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class QueueConfigurationsUpdateProcessNotificationsConfiguration1789425630781
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-process-notifications-queue-configuration.sql",
        "Queue",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-process-notifications-queue-configuration.sql",
        "Queue",
      ),
    );
  }
}

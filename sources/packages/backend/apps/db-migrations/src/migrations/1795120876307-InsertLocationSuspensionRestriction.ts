import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertLocationSuspensionRestriction1795120876307 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Insert-lsc-restriction.sql", "Restrictions"),
    );

    await queryRunner.query(
      getSQLFileData(
        "Insert-ministry-notification-institution-restriction-blocking-application.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-ministry-notification-institution-restriction-blocking-application.sql",
        "NotificationMessages",
      ),
    );

    await queryRunner.query(
      getSQLFileData("Rollback-insert-lsc-restriction.sql", "Restrictions"),
    );
  }
}

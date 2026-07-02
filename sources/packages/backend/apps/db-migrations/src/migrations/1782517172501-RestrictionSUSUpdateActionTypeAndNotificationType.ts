import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RestrictionSUSUpdateActionTypeAndNotificationType1782517172501 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-sus-action-type-and-notification-type.sql",
        "Restrictions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-sus-action-type-and-notification-type.sql",
        "Restrictions",
      ),
    );
  }
}

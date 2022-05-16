import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanRestrictionAddActionAndNotificationTypeRemoveAllowedCountAndSeed1652739341963
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Clean-restriction-add-action-and-notification-type-remove-allowed-count-and-seed.sql",
        "Restrictions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-Clean-restriction-add-action-and-notification-type-remove-allowed-count-and-seed.sql",
        "Restrictions",
      ),
    );
  }
}

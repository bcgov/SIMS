import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertLegacyRestrictionAddedMessage1709232280293
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-legacy-restriction-message.sql",
        "NotificationMessages",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-legacy-restriction-message.sql",
        "NotificationMessages",
      ),
    );
  }
}

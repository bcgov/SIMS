import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateLegacyRestrictionsImpacts1750271915888
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-legacy-restrictions-impacts.sql", "Restrictions"),
    );
  }

  public async down(): Promise<void> {
    // No rollback needed.
  }
}

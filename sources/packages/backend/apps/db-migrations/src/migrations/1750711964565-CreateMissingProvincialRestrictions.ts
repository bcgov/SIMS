import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateMissingProvincialRestrictions1750711964565
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-missing-provincial-restrictions.sql",
        "Restrictions",
      ),
    );
  }

  public async down(): Promise<void> {
    // No down migration planned since reverting this migration would remove the restrictions
    // and there is no need to restore the DB to its previous state in this scenario.
  }
}

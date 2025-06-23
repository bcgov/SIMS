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
    // No down migration planned.
  }
}

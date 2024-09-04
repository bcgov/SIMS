import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateApplicationRestrictionBypassesTable1725052532471
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-application-restriction-bypasses.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-application-restriction-bypasses.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class SetResolvedRestrictionsToBeReprocessed1753309242467
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-resolved-restrictions-to-be-reprocessed.sql",
        "SFASRestrictions",
      ),
    );
  }

  public async down(): Promise<void> {
    // No down migration required since the DB changes are only intended
    // to allow the reprocessing of resolved restrictions.
    // Once the legacy import process is executed the records will be updated
    // to the correct state.
  }
}

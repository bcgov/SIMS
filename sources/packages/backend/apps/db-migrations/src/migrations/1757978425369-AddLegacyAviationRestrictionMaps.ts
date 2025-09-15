import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddLegacyAviationRestrictionMaps1757978425369
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-legacy-aviation-restrictions-maps.sql",
        "SFASRestrictionMaps",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-legacy-aviation-restrictions-maps.sql",
        "SFASRestrictionMaps",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateSFASRestrictionMapsTable1733437987626
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-sfas-restriction-maps.sql", "SFASRestrictionMaps"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-sfas-restriction-maps.sql",
        "SFASRestrictionMaps",
      ),
    );
  }
}

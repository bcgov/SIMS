import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RemoveLegacyB2DMap1757554863902 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-legacy-B2D-map.sql", "SFASRestrictionMaps"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-remove-legacy-B2D-map.sql",
        "SFASRestrictionMaps",
      ),
    );
  }
}

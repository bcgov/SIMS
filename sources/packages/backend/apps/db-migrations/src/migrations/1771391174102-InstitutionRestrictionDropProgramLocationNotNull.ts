import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InstitutionRestrictionDropProgramLocationNotNull1771391174102 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Institution-restrictions-drop-program-location-not-null.sql",
        "Restrictions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-institution-restrictions-drop-program-location-not-null.sql",
        "Restrictions",
      ),
    );
  }
}

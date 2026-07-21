import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertInstitutionActivitySuspendedRestriction1784568732642 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Insert-isr-restriction.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData("Update-sus-metadata.sql", "Restrictions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-insert-isr-restriction.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData("Rollback-update-sus-metadata.sql", "Restrictions"),
    );
  }
}

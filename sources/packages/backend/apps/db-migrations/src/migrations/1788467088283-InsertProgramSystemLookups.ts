import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";
export class InsertProgramSystemLookups1788467088283 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-program-categories-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-program-categories-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
  }
}

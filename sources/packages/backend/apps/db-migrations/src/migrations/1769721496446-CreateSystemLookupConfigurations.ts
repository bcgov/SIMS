import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateSystemLookupConfigurations1769721496446 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-system-lookup-configurations-table.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-country-and-province-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-system-lookup-configurations-table.sql",
        "SystemLookupConfigurations",
      ),
    );
  }
}

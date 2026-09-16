import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateSystemLookupDisabilityImpairment1789451333074 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-disability-impairment-organizing-thoughts.sql",
        "SystemLookupConfigurations",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Update-disability-impairment-asc-desc-stairs.sql",
        "SystemLookupConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disability-impairment-asc-desc-stairs.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-disability-impairment-organizing-thoughts.sql",
        "SystemLookupConfigurations",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigFTSFAOutOfProvincePrivateEligibilityAppeal1777488617667 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-ft-sfa-eligibility-out-of-province-private-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-ft-sfa-eligibility-out-of-province-private-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

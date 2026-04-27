import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigurationInsertPTSFAInternationalInstitutionsEligibilityAppeal1776988078989 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-pt-sfa-eligibility-international-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-pt-sfa-eligibility-international-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

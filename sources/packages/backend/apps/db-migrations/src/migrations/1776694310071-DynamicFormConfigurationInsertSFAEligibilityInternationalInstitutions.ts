import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigurationInsertSFAEligibilityInternationalInstitutions1776694310071 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-sfa-eligibility-international-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-sfa-eligibility-international-institutions.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigInsertPTAccessGrantEligibilityAppeal1776267808408 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-pt-accessibility-grant-eligibility-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-pt-accessibility-grant-eligibility-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

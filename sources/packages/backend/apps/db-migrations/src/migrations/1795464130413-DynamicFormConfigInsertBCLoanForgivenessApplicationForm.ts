import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DynamicFormConfigInsertBCLoanForgivenessApplicationForm1795464130413 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-bc-loan-forgiveness-application-form.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-bc-loan-forgiveness-application-form.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

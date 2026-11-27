import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertBCLoanForgivenessApplicationForm1795464130413 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-bc-loan-forgiveness-application-form.sql",
        "DynamicFormConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-underserved-communities-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-employers-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-works-with-children-occupations-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-underserved-community-occupations-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-underserved-community-occupations-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-works-with-children-occupations-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-employers-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-underserved-communities-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-bc-loan-forgiveness-application-form.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

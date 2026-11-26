import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateReturnedLoanDataModel1795658364976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-returned-loan-event-status.sql", "Types"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-returned-loan-event-categories-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-returned-loan-customers.sql",
        "ReturnedLoanCustomers",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Create-returned-loan-events.sql", "ReturnedLoanEvents"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-returned-loan-events.sql",
        "ReturnedLoanEvents",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-returned-loan-customers.sql",
        "ReturnedLoanCustomers",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-returned-loan-event-categories-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Rollback-create-returned-loan-event-status.sql", "Types"),
    );
  }
}

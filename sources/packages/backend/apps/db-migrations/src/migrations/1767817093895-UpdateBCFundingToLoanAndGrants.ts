import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Migration to update restriction action types from "BC Funding" to a more granular options
 * where loans and grants are separated, and also update existing restrictions to use the new types.
 * Minor naming adjustments were also made to include the missing dashes in part-time and full-time.
 */
export class UpdateBCFundingToLoanAndGrants1767817093895 implements MigrationInterface {
  /**
   * Execute the migrations in the proper order to update restriction action types
   * and update existing restrictions. The order is critical to allow a proper rollback
   * to be executed if needed, since full-time BC funding is now split into two distinct types
   * (loan and grants).
   * @param queryRunner TypeORM query runner.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-restriction-action-types-BC-funding-to-loan-and-grants.sql",
        "Types",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Update-stop-funding-loan-and-grants.sql", "Restrictions"),
    );
  }

  /**
   * Execute the rollback of the migration by reverting the restriction action types
   * and updating existing restrictions to use the previous types.
   * @param queryRunner TypeORM query runner.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-stop-funding-loan-and-grants.sql",
        "Restrictions",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-restriction-action-types-BC-funding-to-loan-and-grants.sql",
        "Types",
      ),
    );
  }
}

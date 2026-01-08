import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateBCFundingToLoanAndGrants1767817093895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-restriction-action-types-BC-funding-to-loan-and-grants.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-restriction-action-types-BC-funding-to-loan-and-grants.sql",
        "Types",
      ),
    );
  }
}

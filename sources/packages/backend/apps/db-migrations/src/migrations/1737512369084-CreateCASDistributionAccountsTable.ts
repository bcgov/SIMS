import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateCASDistributionAccountsTable1737512369084
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-cas-distribution-accounts.sql",
        "CASDistributionAccounts",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-cas-distribution-accounts.sql",
        "CASDistributionAccounts",
      ),
    );
  }
}

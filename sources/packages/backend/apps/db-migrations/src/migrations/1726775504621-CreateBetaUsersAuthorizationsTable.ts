import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateBetaUsersAuthorizationsTable1726775504621
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-beta-users-table.sql", "BetaUsersAuthorizations"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-beta-users-table.sql", "BetaUsersAuthorizations"),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateUsernameSuffixBCeIDUsersToBceIDBothUsers1674685022436
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-bceid-users-suffix-to-bceidboth.sql", "User"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-bceid-users-suffix-to-bceidboth.sql",
        "User",
      ),
    );
  }
}

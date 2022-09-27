import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class RemoveUnusedTypesAndRoles1657301722748
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-unused-types-roles.sql", "AuthCodeTables"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-remove-unused-types-roles.sql",
        "AuthCodeTables",
      ),
    );
  }
}

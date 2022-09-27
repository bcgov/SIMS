import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AuthCodeTables1621260402243 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Table Institution user type
    await queryRunner.query(
      getSQLFileData("Create-institution-user-type.sql", "AuthCodeTables"),
    );

    // Loading initial values
    await queryRunner.query(
      getSQLFileData(
        "Create-initial-institution-user-types.sql",
        "AuthCodeTables",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removing table with data
    await queryRunner.query(
      getSQLFileData("Drop-institution-user-type.sql", "AuthCodeTables"),
    );
  }
}

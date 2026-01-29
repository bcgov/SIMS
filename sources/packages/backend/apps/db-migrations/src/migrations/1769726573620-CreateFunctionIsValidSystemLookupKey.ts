import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateFunctionIsValidSystemLookupKey1769726573620 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-function-is-valid-system-lookup-key.sql",
        "Functions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-function-is-valid-system-lookup-key.sql",
        "Functions",
      ),
    );
  }
}

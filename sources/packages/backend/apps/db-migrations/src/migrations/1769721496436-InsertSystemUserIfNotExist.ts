import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InsertSystemUserIfNotExist1769721496436 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Insert-system-user-if-not-exist.sql", "User"),
    );
  }

  public async down(): Promise<void> {
    // Do nothing as system user is not expected to be removed.
  }
}

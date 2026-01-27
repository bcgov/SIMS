import { getSQLFileData } from "../utilities/sqlLoader";

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserEmailIndex1769456271420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-index-lowercase-email.sql", "User"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-create-index-lowercase-email.sql", "User"),
    );
  }
}

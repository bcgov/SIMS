import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "InstitutionUsers";

export class InstitutionUsers1621277444239 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old pivot table, that is casing problem
    await queryRunner.query(
      getSQLFileData("Drop-Institutions-Users.sql", "Institution"),
    );

    await queryRunner.query(
      getSQLFileData("Create-institution-users.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-institution-users.sql", DIR));

    // Restore pivot table
    await queryRunner.query(
      getSQLFileData("Create-Institutions-Users.sql", "Institution"),
    );
  }
}

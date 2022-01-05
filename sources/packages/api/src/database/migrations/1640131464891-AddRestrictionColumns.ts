import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddRestrictionColumns1640131464891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-restriction-category.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData("Add-cols-restriction-resolved-notes.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData("Alter-audit-cols-with-timezone.sql", "Restrictions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-audit-cols-with-timezone.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Drop-cols-restriction-resolved-notes.sql",
        "Restrictions",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Drop-col-restriction-category.sql", "Restrictions"),
    );
  }
}

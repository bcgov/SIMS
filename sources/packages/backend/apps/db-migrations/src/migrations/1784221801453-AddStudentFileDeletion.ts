import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStudentFileDeletion1784221801453 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-deleted-at-column.sql", "StudentFiles"),
    );
    await queryRunner.query(
      getSQLFileData("Add-deletion-note-id-column.sql", "StudentFiles"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-deletion-note-id-column.sql",
        "StudentFiles",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Rollback-add-deleted-at-column.sql", "StudentFiles"),
    );
  }
}

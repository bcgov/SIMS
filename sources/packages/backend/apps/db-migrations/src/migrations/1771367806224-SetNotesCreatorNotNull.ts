import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Migration to set the creator field as NOT NULL for notes.
 * This ensures data integrity by enforcing the creator field at the database level.
 */
export class SetNotesCreatorNotNull1771367806224 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Set-notes-creator-not-null.sql", "Notes"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-set-notes-creator-not-null.sql", "Notes"),
    );
  }
}

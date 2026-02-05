import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Migration to set the creator field for applications using the mapped user ID from the student ID.
 * This ensures all applications have a non-null creator field that references the student who created/submitted them.
 * This addresses the first acceptance criterion of ticket #5154.
 */
export class SetApplicationCreatorFromStudentId1770252146185 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Set-creator-from-student-id.sql", "Applications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-set-creator-from-student-id.sql",
        "Applications",
      ),
    );
  }
}

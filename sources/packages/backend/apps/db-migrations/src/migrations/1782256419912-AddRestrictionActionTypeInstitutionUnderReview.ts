import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Migration to add the new restriction action types for the "Institution under review".
 * These actions are intended to be generic and reusable for future restrictions that may be added to the system.
 */
export class AddRestrictionActionTypeInstitutionUnderReview1782256419912 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-restriction-action-type-institution-under-review.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-restriction-action-type-institution-under-review.sql",
        "Types",
      ),
    );
  }
}

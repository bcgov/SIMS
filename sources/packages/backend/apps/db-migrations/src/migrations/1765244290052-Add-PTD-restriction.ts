import { getSQLFileData } from "../utilities/sqlLoader";
import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to add the PTD (Provincial Training Difference) restriction.
 * This restriction indicates that a student's account has been closed by the province
 * and prevents them from applying for or receiving further funding.
 */
export class AddPTDRestriction1765244290052 implements MigrationInterface {
  /**
   * Executes the migration to add the PTD restriction to the database.
   * @param queryRunner the query runner for executing database operations.
   * @returns a promise that resolves when the migration completes.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-PTD-restriction.sql", "Restrictions"),
    );
  }

  /**
   * Rolls back the migration by removing the PTD restriction from the database.
   * @param queryRunner the query runner for executing database operations.
   * @returns a promise that resolves when the rollback completes.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-PTD-restriction.sql", "Restrictions"),
    );
  }
}

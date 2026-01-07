import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

/**
 * Update the disbursement reports to remove the sort by funding code.
 */
export class UpdateDisbursementRemoveSort1767806307431 implements MigrationInterface {
  /**
   * Update the disbursement reports to remove the sort by funding code.
   * @param queryRunner the query runner.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-disbursement-report-remove-sort.sql", "Reports"),
    );
  }

  /**
   * Rollback the disbursement reports update that removed the sort by funding code.
   * @param queryRunner the query runner.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursement-report-remove-sort.sql",
        "Reports",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateDisbursementRemoveSort1767806307431 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-disbursement-remove-sort.sql", "Reports"),
    );
  }

  /**
   * Rollback the disbursement reports update that included the "Forecast Date" column.
   * @param queryRunner the query runner.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-update-disbursement-remove-sort.sql", "Reports"),
    );
  }
}

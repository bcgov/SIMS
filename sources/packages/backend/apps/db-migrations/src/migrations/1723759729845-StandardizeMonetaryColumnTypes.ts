import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class StandardizeMonetaryColumnTypes1723759729845
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Standardize-monetary-columns.sql",
        "DisbursementReceipts",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Standardize-monetary-columns.sql",
        "DisbursementReceiptValues",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Standardize-monetary-columns.sql",
        "DisbursementSchedules",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Standardize-monetary-columns.sql", "SFASIndividuals"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Standardize-monetary-columns.sql",
        "SFASPartTimeApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-standardize-monetary-columns.sql",
        "DisbursementReceipts",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-standardize-monetary-columns.sql",
        "DisbursementReceiptValues",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-standardize-monetary-columns.sql",
        "DisbursementSchedules",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-standardize-monetary-columns.sql",
        "SFASIndividuals",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-standardize-monetary-columns.sql",
        "SFASPartTimeApplications",
      ),
    );
  }
}

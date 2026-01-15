import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class SFASApplicationsAddWTHDProcessedColumn1768349577678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-wthd-processed-column.sql", "SFASApplications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-wthd-processed-column.sql",
        "SFASApplications",
      ),
    );
  }
}

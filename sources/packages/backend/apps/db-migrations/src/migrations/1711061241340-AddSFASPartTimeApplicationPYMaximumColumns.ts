import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddSFASPartTimeApplicationPYMaximumColumns1711061241340
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-col-py-maximum-support.sql",
        "SFASPartTimeApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-col-py-maximum-support.sql",
        "SFASPartTimeApplications",
      ),
    );
  }
}

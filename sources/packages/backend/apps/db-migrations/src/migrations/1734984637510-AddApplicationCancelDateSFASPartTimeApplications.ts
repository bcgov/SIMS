import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddApplicationCancelDateSFASPartTimeApplications1734984637510
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-application-cancel-date.sql",
        "SFASPartTimeApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-application-cancel-date.sql",
        "SFASPartTimeApplications",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddSFASPartTimeApplicationColumns1711061241340
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-cols-sfas-pt-awards.sql", "SFASPartTimeApplications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-cols-sfas-pt-awards.sql",
        "SFASPartTimeApplications",
      ),
    );
  }
}

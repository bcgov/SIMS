import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddColSupportingUserIdToCRAIncomeVerifications1634070831192
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-col-supporting-user-id.sql",
        "CRAIncomeVerifications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-col-supporting-user-id.sql",
        "CRAIncomeVerifications",
      ),
    );
  }
}

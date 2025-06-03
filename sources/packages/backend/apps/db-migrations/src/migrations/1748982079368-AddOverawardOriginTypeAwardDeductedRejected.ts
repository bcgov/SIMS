import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddOverawardOriginTypeAwardDeductedRejected1748982079368
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-overaward-origin-type-award-deducted-rejected.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-overaward-origin-type-award-deducted-rejected.sql",
        "Types",
      ),
    );
  }
}

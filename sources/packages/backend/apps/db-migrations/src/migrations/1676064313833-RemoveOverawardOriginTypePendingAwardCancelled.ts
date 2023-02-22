import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RemoveOverawardOriginTypePendingAwardCancelled1676064313833
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-overaward-origin-type-pending-award-cancelled.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-remove-overaward-origin-type-pending-award-cancelled.sql",
        "Types",
      ),
    );
  }
}

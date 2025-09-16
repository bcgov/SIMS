import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class StudentRestrictionsAddDeletedAndAuditColumns1758065738801
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-cols-restriction-deleted-and-audit.sql",
        "Restrictions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-cols-restriction-deleted-and-audit.sql",
        "Restrictions",
      ),
    );
  }
}

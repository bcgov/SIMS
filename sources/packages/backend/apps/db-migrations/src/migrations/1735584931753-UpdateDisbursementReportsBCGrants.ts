import { getSQLFileData } from "@sims/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDisbursementReportsBCGrants1735584931753
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-disbursements-report-bc-grants.sql", "Reports"),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursements-report-bc-grants.sql",
        "Reports",
      ),
    );
  }
}

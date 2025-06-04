import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateDisbursementScheduleStatusRejected1748978283307
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-disbursement-schedule-status-rejected.sql",
        "DisbursementSchedules",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursement-schedule-status-rejected.sql",
        "DisbursementSchedules",
      ),
    );
  }
}

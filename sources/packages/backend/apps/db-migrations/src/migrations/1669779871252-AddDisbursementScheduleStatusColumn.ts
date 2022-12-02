import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddDisbursementScheduleStatusColumn1669779871252
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-disbursement-schedule-status-col.sql",
        "DisbursementSchedules",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-disbursement-schedule-status-col.sql",
        "DisbursementSchedules",
      ),
    );
  }
}

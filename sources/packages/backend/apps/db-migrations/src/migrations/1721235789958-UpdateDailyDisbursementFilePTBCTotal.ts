import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateDailyDisbursementFilePTBCTotal1721235789958
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-daily-disbursement-file-pt-bc-total.sql",
        "Reports",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-daily-disbursement-file-pt-bc-total.sql",
        "Reports",
      ),
    );
  }
}

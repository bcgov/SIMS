import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DisbursementSchedulesAddHasEstimatedAwards1732577112272
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-has-estimated-awards-col.sql",
        "DisbursementSchedules",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-has-estimated-awards-col.sql",
        "DisbursementSchedules",
      ),
    );
  }
}

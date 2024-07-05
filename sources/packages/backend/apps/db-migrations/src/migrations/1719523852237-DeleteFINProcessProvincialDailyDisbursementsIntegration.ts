import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DeleteFINProcessProvincialDailyDisbursementsIntegration1719523852237
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-fin-process-provincial-daily-disbursements-integration.sql",
        "Queue",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-drop-fin-process-provincial-daily-disbursements-integration.sql",
        "Queue",
      ),
    );
  }
}

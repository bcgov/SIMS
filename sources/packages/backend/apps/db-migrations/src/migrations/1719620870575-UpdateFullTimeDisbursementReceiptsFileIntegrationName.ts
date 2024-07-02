import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateFullTimeDisbursementReceiptsFileIntegrationName1719620870575
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-full-time-disbursement-receipts-file-integration-name.sql",
        "Queue",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-full-time-disbursement-receipts-file-integration-name.sql",
        "Queue",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DeleteLegacyOverawardRecordsDisbursementOverawards1736973127750
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-legacy-overawards-records.sql",
        "DisbursementOverawards",
      ),
    );
  }

  public async down(): Promise<void> {
    // No rollback is needed after the above records are deleted.
    // The SFAS bridge process will add back the data,
    // which will be considered a recover of the data.
  }
}

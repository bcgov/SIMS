import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateDisbursementOverawardsTable1669779857438
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-disbursement-overawards-table.sql",
        "DisbursementOverawards",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-disbursement-overawards-table.sql",
        "DisbursementOverawards",
      ),
    );
  }
}

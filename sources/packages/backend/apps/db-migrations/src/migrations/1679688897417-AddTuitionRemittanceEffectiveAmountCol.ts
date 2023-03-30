import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddTuitionRemittanceEffectiveAmountCol1679688897417
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-tuition-remittance-effective-amount-col.sql",
        "DisbursementSchedules",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-tuition-remittance-effective-amount-col.sql",
        "DisbursementSchedules",
      ),
    );
  }
}

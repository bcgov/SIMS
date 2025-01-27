import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateSFASApplicationDisbursements1737943189736
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-sfas-application-disbursements.sql",
        "SFASApplicationDisbursements",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-sfas-application-disbursements.sql",
        "SFASApplicationDisbursements",
      ),
    );
  }
}

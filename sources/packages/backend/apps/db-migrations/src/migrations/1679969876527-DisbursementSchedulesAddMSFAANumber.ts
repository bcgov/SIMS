import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";
export class DisbursementSchedulesAddMSFAANumber1679969876527
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop msfaa-number-id column from applications.
    await queryRunner.query(
      getSQLFileData("Drop-col-msfaa-number-id.sql", "Applications"),
    );

    // Add msfaa-number-id column to disbursement_schedules.
    await queryRunner.query(
      getSQLFileData("Add-col-msfaa-number-id.sql", "DisbursementSchedules"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-msfaa-number-id.sql", "DisbursementSchedules"),
    );

    await queryRunner.query(
      getSQLFileData("Add-col-msfaa-number-id.sql", "Applications"),
    );
  }
}

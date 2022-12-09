import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateDisbursementScheduleStatus1669779843502
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-disbursement-schedule-status.sql", "Types"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-disbursement-schedule-status.sql", "Types"),
    );
  }
}

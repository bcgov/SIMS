import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class OfferingAddOnlineInstructionColumns1743799586745
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-online-instruction-columns.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-online-instruction-columns.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

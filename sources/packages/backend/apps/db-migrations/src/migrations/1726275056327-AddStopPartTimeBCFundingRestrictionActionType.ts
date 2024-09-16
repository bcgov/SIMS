import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStopPartTimeBCFundingRestrictionActionType1726275056327
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-stop-part-time-bc-funding-restriction-action-type.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-stop-part-time-bc-funding-restriction-action-type.sql",
        "Types",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RenameScholasticStandingChangeInIntensityToSchoolTransfer1715975855667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rename-scholastic-standing-change-in-intensity-to-school-transfer.sql",
        "Types",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-rename-scholastic-standing-change-in-intensity-to-school-transfer.sql",
        "Types",
      ),
    );
  }
}

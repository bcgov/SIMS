import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RenameAssessedCostsDiscretionaryExpensesSFAS1740023856890
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rename-assessed-costs-discretionary-expenses.sql",
        "SFASApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-rename-assessed-costs-discretionary-expenses.sql",
        "SFASApplications",
      ),
    );
  }
}

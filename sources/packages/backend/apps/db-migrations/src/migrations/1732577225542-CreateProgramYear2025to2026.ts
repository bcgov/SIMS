import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateProgramYear2025to20261732577225542
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-program-year-2025-2026.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-program-year-2025-2026.sql",
        "ProgramYear",
      ),
    );
  }
}

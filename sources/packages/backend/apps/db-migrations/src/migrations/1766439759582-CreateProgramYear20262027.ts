import { getSQLFileData } from "@sims/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProgramYear202620271766439759582
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-program-year-2026-2027.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-program-year-2026-2027.sql",
        "ProgramYear",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DropEducationProgramsEffectiveEndDate1795013487350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-program-and-offering-status-report-remove-expiry-date.sql",
        "Reports",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Drop-effective-end-date.sql", "EducationPrograms"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-drop-effective-end-date.sql",
        "EducationPrograms",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-program-and-offering-status-report-remove-expiry-date.sql",
        "Reports",
      ),
    );
  }
}

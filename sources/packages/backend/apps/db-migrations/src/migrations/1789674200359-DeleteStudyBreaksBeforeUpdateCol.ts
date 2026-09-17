import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DeleteStudyBreaksBeforeUpdateCol1789674200359 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-study-breaks-before-update.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(): Promise<void> {
    // No down migration needed here.
  }
}

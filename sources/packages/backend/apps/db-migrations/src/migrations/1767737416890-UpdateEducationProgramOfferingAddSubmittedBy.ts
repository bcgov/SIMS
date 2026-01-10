import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateEducationProgramOfferingAddSubmittedBy1767737416890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-submitted-by.sql", "EducationProgramsOfferings"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-submitted-by.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanEducationProgramOfferingAddRemoveCol1653426583147
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("", "EducationProgramsOfferings"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-clean-restriction-alter-cols-and-seed.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

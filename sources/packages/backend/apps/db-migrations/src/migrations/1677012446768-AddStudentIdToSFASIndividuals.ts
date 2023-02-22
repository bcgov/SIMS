import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStudentIdToSFASIndividuals1677012446768
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-student-id-sfas-individuals.sql", "SFASIndividuals"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-student-id-sfas-individuals.sql",
        "SFASIndividuals",
      ),
    );
  }
}

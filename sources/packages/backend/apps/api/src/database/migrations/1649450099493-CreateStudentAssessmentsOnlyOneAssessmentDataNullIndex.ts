import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateStudentAssessmentsOnlyOneAssessmentDataNullIndex1649450099493
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-index-only-one-assessment-data-null.sql",
        "StudentAssessments",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-index-only-one-assessment-data-null.sql",
        "StudentAssessments",
      ),
    );
  }
}

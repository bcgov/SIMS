import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RemoveConstraintStudentAssessmentsOnlyOneAssessmentDataNullIndex1706733349802
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-index-only-one-assessment-data-null.sql",
        "StudentAssessments",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-drop-index-only-one-assessment-data-null.sql",
        "StudentAssessments",
      ),
    );
  }
}

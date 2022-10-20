import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ChangeAssessmentWorkflowIdType1666035430481
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Change-assessment-workflow-id-col-type.sql",
        "StudentAssessments",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-change-assessment-workflow-id-col-type.sql",
        "StudentAssessments",
      ),
    );
  }
}

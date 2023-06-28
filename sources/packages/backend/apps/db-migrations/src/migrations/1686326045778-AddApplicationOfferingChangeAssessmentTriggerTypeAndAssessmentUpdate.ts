import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddApplicationOfferingChangeAssessmentTriggerTypeAndAssessmentUpdate1686326045778
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-application-offering-change-assessment-trigger-type.sql",
        "Types",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Add-application-offering-change-to-assessment.sql",
        "StudentAssessments",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-application-offering-change-from-assessment.sql",
        "StudentAssessments",
      ),
    );

    await queryRunner.query(
      getSQLFileData(
        "Remove-application-offering-change-assessment-trigger-type.sql",
        "Types",
      ),
    );
  }
}

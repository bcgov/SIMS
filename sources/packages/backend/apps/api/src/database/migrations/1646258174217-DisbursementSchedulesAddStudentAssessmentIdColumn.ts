import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class DisbursementSchedulesAddStudentAssessmentIdColumn1646258174217
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-student-assessment-id-col.sql",
        "DisbursementSchedules",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-student-assessment-id-col.sql",
        "DisbursementSchedules",
      ),
    );
  }
}

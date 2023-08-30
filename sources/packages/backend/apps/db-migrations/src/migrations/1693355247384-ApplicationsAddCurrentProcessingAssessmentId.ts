import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ApplicationsAddCurrentProcessingAssessmentId1693355247384
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-col-current-processing-assessment-id.sql",
        "Applications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-col-current-processing-assessment-id.sql",
        "Applications",
      ),
    );
  }
}

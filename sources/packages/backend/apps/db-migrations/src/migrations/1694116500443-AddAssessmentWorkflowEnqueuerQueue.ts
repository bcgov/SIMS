import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddAssessmentWorkflowEnqueuerQueue1694116500443
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-assessment-workflow-enqueuer-queue.sql", "Queue"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-assessment-workflow-enqueuer-queue.sql",
        "Queue",
      ),
    );
  }
}

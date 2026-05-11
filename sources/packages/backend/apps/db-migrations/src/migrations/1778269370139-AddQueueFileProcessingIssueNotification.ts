import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddQueueFileProcessingIssueNotification1778269370139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-file-processing-issue-notification.sql", "Queue"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-file-processing-issue-notification.sql",
        "Queue",
      ),
    );
  }
}

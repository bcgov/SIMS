import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateStudentAppealRequestsTable1646258049704
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-student-appeal-requests.sql",
        "StudentAppealRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-student-appeal-requests.sql",
        "StudentAppealRequests",
      ),
    );
  }
}

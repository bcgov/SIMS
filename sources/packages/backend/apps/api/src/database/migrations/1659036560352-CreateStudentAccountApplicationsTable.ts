import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateStudentAccountApplicationsTable1659036560352
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-student-account-applications.sql",
        "StudentAccountApplication",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-student-account-applications.sql",
        "StudentAccountApplication",
      ),
    );
  }
}

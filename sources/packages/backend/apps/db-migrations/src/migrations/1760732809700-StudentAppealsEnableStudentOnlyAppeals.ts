import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class StudentAppealsEnableStudentOnlyAppeals1760732809700
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Enable-student-only-appeals.sql", "StudentAppeals"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-enable-student-only-appeals.sql",
        "StudentAppeals",
      ),
    );
  }
}

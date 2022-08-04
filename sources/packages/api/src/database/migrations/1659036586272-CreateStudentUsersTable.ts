import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateStudentUsersTable1659036586272
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-student-users.sql", "StudentUsers"),
    );
    await queryRunner.query(
      getSQLFileData("Populate-student-users-initial-data.sql", "StudentUsers"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-student-users.sql", "StudentUsers"),
    );
  }
}

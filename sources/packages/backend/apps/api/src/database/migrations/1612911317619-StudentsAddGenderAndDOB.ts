import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class StudentsAddGenderAndDOB1612911317619
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Add-GenderAndDOB.sql", "Student"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-GenderAndDOB.sql", "Student"),
    );
  }
}

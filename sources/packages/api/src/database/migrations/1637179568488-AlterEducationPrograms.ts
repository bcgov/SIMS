import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AlterEducationPrograms1637179568488 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Alter-education-programs.sql", "EducationPrograms"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-eduction-programs.sql",
        "EducationPrograms",
      ),
    );
  }
}

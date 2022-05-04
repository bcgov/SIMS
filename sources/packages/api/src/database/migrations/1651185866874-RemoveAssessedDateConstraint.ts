import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";
export class RemoveAssessedDateConstraint1651185866874
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Alter-assessed_date.sql", "EducationPrograms"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-assessed-date-constraint.sql",
        "EducationPrograms",
      ),
    );
  }
}

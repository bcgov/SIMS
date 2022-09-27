import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class UpdateApplicationsAddColRelationshipStudentNumber1639434770501
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-relationship-student-number.sql", "Applications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-col-relationship-student-number.sql",
        "Applications",
      ),
    );
  }
}

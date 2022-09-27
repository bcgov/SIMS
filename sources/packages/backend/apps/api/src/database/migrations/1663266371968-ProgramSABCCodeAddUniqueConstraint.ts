import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class ProgramSABCCodeAddUniqueConstraint1663266371968
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-sabc-code-unique-constraint.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-sabc-code-unique-constraint.sql",
        "EducationPrograms",
      ),
    );
  }
}

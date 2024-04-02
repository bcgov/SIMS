import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AlterSABCCodeUniqueConstraintToActivePrograms1711405137371
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-sabc-code-unique-constraint-to-active-programs.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-sabc-code-unique-constraint-to-active-programs.sql",
        "EducationPrograms",
      ),
    );
  }
}

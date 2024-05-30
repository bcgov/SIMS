import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DropSABCCodeUniqueConstraint1716850225552
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-sabc-code-unique-constraint-to-active-programs.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-drop-sabc-code-unique-constraint-to-active-programs.sql",
        "EducationPrograms",
      ),
    );
  }
}

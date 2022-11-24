import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DropSABCCodeUniqueConstraint1669075586763
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-sabc-code-unique-constraint.sql",
        "EducationPrograms",
      ),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-sabc-code-unique-constraint.sql",
        "EducationPrograms",
      ),
    );
  }
}

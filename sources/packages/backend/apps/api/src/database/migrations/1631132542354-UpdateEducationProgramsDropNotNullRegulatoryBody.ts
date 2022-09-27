import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class UpdateEducationProgramsDropNotNullRegulatoryBody1631132542354
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-not-null-regulatory-body.sql", "EducationPrograms"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Set-not-null-regulatory-body.sql", "EducationPrograms"),
    );
  }
}

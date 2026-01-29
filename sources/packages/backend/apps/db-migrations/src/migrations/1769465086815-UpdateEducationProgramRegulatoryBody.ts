import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateEducationProgramRegulatoryBody1769465086815 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rename-regulatory-body-ptib-to-ptiru.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-rename-regulatory-body-ptib-to-ptiru.sql",
        "EducationPrograms",
      ),
    );
  }
}

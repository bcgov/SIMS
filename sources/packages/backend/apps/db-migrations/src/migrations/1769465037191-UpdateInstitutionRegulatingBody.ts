import { getSQLFileData } from "../utilities/sqlLoader";
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateInstitutionRegulatingBody1769465037191 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rename-regulating-body-ptib-to-ptiru.sql", "Institution"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-rename-regulating-body-ptib-to-ptiru.sql",
        "Institution",
      ),
    );
  }
}

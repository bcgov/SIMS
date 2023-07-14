import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStudentPDStatusCol1689350242512 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-permanent-disability-status.sql", "Types"),
    );
    await queryRunner.query(getSQLFileData("Add-col-pd-status.sql", "Student"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-pd-status.sql", "Student"),
    );
    await queryRunner.query(
      getSQLFileData("Drop-permanent-disability-status.sql", "Types"),
    );
  }
}

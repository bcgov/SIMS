import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class StudentPDStatusFields1626292228508 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-StudentPDStatusFields.sql", "StudentPDStatusFields"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-StudentPDStatusFields", "StudentPDStatusFields"),
    );
  }
}

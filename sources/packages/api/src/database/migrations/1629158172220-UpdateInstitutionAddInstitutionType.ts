import { getSQLFileData } from "src/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateInstitutionAddInstitutionType1629158172220
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("add-col-institution-type.sql", "Institution"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("drop-col-institution-type.sql", "Institution"),
    );
  }
}

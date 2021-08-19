import { getSQLFileData } from "src/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInstitutionType1629158157313 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("create-institution-type.sql", "InstitutionType"),
    );

    await queryRunner.query(
      getSQLFileData("create-initial-institution-types.sql", "InstitutionType"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("drop-institution-type.sql", "InstitutionType"),
    );
  }
}

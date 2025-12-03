import { getSQLFileData } from "../utilities/sqlLoader";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstitutionType1764799418986 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-institution-type-out-of-province.sql",
        "InstitutionType",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-institution-type-out-of-province.sql",
        "InstitutionType",
      ),
    );
  }
}

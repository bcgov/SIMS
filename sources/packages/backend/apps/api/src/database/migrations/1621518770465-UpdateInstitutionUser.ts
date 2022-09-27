import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "InstitutionUsers";

export class UpdateInstitutionUser1621518770465 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-institution-user-guid.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-institution-user-guid.sql", DIR),
    );
  }
}

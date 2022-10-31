import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddHasIntegrationToInstitutionCode1667255099803
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-has-integration.sql", "InstitutionLocations"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-has-integration.sql", "InstitutionLocations"),
    );
  }
}

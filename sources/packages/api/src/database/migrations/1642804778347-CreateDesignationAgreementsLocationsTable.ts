import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateDesignationAgreementsLocationsTable1642804778347
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-designation-agreement-locations-table.sql",
        "DesignationAgreementsLocations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-designation-agreement-locations-table.sql",
        "DesignationAgreementsLocations",
      ),
    );
  }
}

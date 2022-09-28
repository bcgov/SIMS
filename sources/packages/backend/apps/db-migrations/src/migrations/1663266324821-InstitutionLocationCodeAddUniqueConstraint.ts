import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class InstitutionLocationCodeAddUniqueConstraint1663266324821
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-location-code-unique-constraint.sql",
        "InstitutionLocations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-location-code-unique-constraint.sql",
        "InstitutionLocations",
      ),
    );
  }
}

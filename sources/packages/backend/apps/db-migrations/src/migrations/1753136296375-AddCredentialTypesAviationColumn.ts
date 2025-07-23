import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddCredentialTypesAviationColumn1753136296375
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-credential-types-aviation-column.sql",
        "EducationPrograms",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-credential-types-aviation-column.sql",
        "EducationPrograms",
      ),
    );
  }
}

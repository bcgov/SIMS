import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddInstitutionReadOnlyUserType1735859368020
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-institution-read-only-user-type.sql",
        "AuthCodeTables",
      ),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-institution-read-only-user-type.sql",
        "AuthCodeTables",
      ),
    );
  }
}

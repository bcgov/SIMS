import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RecreateInstitutionRestrictions1764277395472
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Recreate-institution-restrictions.sql",
        "InstitutionRestrictions",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-recreate-institution-restrictions.sql",
        "InstitutionRestrictions",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateApplicationRestrictionBypassesForInstitutionRestrictionBypasses1770773842534 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-application-restriction-bypasses-for-institution-restriction-bypasses.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-application-restriction-bypasses-for-institution-restriction-bypasses.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }
}

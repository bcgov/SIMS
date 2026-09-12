import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AlterApplicationRestrictionBypassesBypassBehaviorNullable1788300265991 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-application-restriction-bypasses-bypass-behavior-nullable.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-application-restriction-bypasses-bypass-behavior-nullable.sql",
        "ApplicationRestrictionBypasses",
      ),
    );
  }
}

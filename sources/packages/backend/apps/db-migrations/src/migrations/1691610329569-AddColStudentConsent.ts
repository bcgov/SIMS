import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddColStudentConsent1691610329569 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-col-student-consent.sql",
        "ApplicationOfferingChangeRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-col-student-consent.sql",
        "ApplicationOfferingChangeRequests",
      ),
    );
  }
}

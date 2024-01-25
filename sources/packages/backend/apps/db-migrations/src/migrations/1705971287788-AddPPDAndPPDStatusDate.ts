import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddPPDAndPPDStatusDate1705971287788 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-ppd-status-ppd-status-date.sql", "SFASIndividuals"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-ppd-status-ppd-status-date.sql", "SFASIndividuals"),
    );
  }
}

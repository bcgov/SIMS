import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DesignationAgreementsTableAlterSubmittedData1680120153698
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-col-submitted_data-drop-not-null.sql",
        "DesignationAgreements",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-col-submitted_data-add-not-null.sql",
        "DesignationAgreements",
      ),
    );
  }
}

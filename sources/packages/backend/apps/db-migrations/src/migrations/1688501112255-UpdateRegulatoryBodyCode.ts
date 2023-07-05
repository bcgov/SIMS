import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class UpdateRegulatoryBodyCode1688501112255
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    /*
    Update the regulating body ita to skilledTradesBC in education program relation.
    */
    await queryRunner.query(
      getSQLFileData(
        "Update-regulatory-body-ita-code.sql",
        "EducationPrograms",
      ),
    );
    /*
    Update the regulating body ita to skilledTradesBC in institution relation.
    */
    await queryRunner.query(
      getSQLFileData("Update-regulatory-body-ita-code.sql", "Institution"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /*
    Revert the regulatory body skilledTradesBC to ita in education program relation.
    */
    await queryRunner.query(
      getSQLFileData(
        "Revert-regulatory-body-ita-code.sql",
        "EducationPrograms",
      ),
    );
    /*
    Revert the regulatory body skilledTradesBC to ita in institution relation.
    */
    await queryRunner.query(
      getSQLFileData("Revert-regulatory-body-ita-code.sql", "Institution"),
    );
  }
}

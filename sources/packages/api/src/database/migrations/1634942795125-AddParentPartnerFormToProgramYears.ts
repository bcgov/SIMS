import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddParentPartnerFormToProgramYears1634942795125
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-parent-partner-form.sql", "ProgramYear"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-parent-partner-form.sql", "ProgramYear"),
    );
  }
}

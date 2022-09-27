import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class SINValidationsAlterColumnsForESDCValidation1655358159250
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-columns-for-esdc-sin-validations.sql",
        "SINValidations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-columns-for-esdc-sin-validations.sql",
        "SINValidations",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class ChangeSINValidationReferenceToStudent1662507874777
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-column-student-id.sql", "SINValidations"),
    );

    await queryRunner.query(
      getSQLFileData("Update-column-student-id.sql", "SINValidations"),
    );

    await queryRunner.query(
      getSQLFileData("Drop-column-user-id.sql", "SINValidations"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-column-user-id-to-rollback.sql", "SINValidations"),
    );

    await queryRunner.query(
      getSQLFileData("Update-column-user-id-to-rollback.sql", "SINValidations"),
    );

    await queryRunner.query(
      getSQLFileData("Drop-column-student-id.sql", "SINValidations"),
    );
  }
}

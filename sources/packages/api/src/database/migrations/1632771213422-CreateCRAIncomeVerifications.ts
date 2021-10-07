import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateCRAIncomeVerifications1632771213422
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-cra-income-verifications.sql",
        "CRAIncomeVerifications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-cra-income-verifications.sql",
        "CRAIncomeVerifications",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";
export class CreateReportsConfig1652919755335 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-reports-config.sql", "Reports"),
    );
    await queryRunner.query(
      getSQLFileData("Create-initial-reports-config.sql", "Reports"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-reports-config.sql", "Reports"),
    );
  }
}

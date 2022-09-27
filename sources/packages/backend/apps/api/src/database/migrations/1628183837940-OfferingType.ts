import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class OfferingType1628183837940 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Create-OfferingType.sql", "Types"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-OfferingType.sql", "Types"));
  }
}

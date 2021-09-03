import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateMSFAANumbersTable1630699820691
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("create-msfaa-numbers-table.sql", "MSFAANumbers"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("drop-msfaa-numbers-table.sql", "MSFAANumbers"),
    );
  }
}

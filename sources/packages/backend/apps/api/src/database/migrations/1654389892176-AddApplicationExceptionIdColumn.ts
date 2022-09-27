import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationExceptionIdColumn1654389892176
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-application-exception-id.sql", "Applications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-col-application-exception-id.sql", "Applications"),
    );
  }
}

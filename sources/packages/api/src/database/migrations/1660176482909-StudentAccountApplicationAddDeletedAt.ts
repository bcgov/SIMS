import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class StudentAccountApplicationAddDeletedAt1660176482909
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-deleted-at-col.sql", "StudentAccountApplication"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Remove-deleted-at-col.sql", "StudentAccountApplication"),
    );
  }
}

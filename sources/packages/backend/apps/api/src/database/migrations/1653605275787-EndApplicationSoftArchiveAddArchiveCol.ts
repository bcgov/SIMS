import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class EndApplicationSoftArchiveAddArchiveCol1653605275787
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-archive.sql", "Applications"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-add-col-archive.sql", "Applications"),
    );
  }
}

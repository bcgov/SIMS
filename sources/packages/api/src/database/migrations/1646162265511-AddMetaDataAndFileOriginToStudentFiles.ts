import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AddMetaDataAndFileOriginToStudentFiles1646162265511
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-metadata-and-file-origin.sql", "StudentFiles"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-metadata-and-file-origin.sql", "StudentFiles"),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DeleteFileContentAndMimeTypeColumns1724457049888
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-file-content-and-mime-type-columns.sql",
        "StudentFiles",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-delete-file-content-and-mime-type-columns.sql",
        "StudentFiles",
      ),
    );
  }
}

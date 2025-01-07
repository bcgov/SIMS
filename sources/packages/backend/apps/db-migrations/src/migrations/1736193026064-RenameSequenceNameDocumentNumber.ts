import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RenameSequenceNameDocumentNumber1736193026064
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-disbursement-document-number-sequence.sql",
        "SequenceControl",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-disbursement-document-number-sequence.sql",
        "SequenceControl",
      ),
    );
  }
}

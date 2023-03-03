import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddNoteIdAddedByAddedDateToDisbursementOverawards1677801820875
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-note-id-added-by-added-date.sql",
        "DisbursementOverawards",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-note-id-added-by-added-date.sql",
        "DisbursementOverawards",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class AlterSequenceControlsNumberToBigInt1630700820310
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Alter-sequence-number-col-bigint.sql", "SequenceControl"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-sequence-number-col-bigint.sql",
        "SequenceControl",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateFederalRestrictionsTable1638470728823
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-federal-restrictions-table.sql",
        "Restrictions/Federal",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-federal-restrictions-table.sql",
        "Restrictions/Federal",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class UpdateInitialFederalRestrictions1637954636336
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Update-initial-federal-restrictions.sql", "Restrictions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-update-initial-federal-restrictions.sql",
        "Restrictions",
      ),
    );
  }
}

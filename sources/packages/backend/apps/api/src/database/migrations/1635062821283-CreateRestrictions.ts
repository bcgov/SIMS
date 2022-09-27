import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreateRestrictions1635062821283 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-restrictions.sql", "Restrictions"),
    );

    await queryRunner.query(
      getSQLFileData("Create-initial-restrictions.sql", "Restrictions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Drop-restrictions.sql", "Restrictions"),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class DeleteImpairmentsBeforeUpdateCol1789675751784 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Delete-impairments-before-update.sql",
        "StudentDisabilityProfileDisabilities",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-delete-impairments-before-update.sql",
        "StudentDisabilityProfileDisabilities",
      ),
    );
  }
}

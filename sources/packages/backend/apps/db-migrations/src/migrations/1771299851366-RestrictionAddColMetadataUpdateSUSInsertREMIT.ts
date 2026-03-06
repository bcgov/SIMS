import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class RestrictionAddColMetadataUpdateSUSInsertREMIT1771299851366 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-metadata-and-update-sus.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData("Insert-remit-restriction.sql", "Restrictions"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Rollback-insert-remit-restriction.sql", "Restrictions"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-col-metadata-and-update-sus.sql",
        "Restrictions",
      ),
    );
  }
}

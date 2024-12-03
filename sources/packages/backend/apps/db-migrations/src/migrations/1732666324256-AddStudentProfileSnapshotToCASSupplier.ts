import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";
export class AddStudentProfileSnapshotToCASSupplier1732666324256
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-student-profile-snapshot-column.sql", "CASSuppliers"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-student-profile-snapshot-column.sql",
        "CASSuppliers",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateBatchRestriction1793399279586 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-batch-restriction-identifier-types.sql", "Types"),
    );
    await queryRunner.query(
      getSQLFileData("Create-batch-restrictions.sql", "BatchRestrictions"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-batch-restriction-students.sql",
        "BatchRestrictionStudents",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-batch-restriction-students.sql",
        "BatchRestrictionStudents",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-batch-restrictions.sql",
        "BatchRestrictions",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-batch-restriction-identifier-types.sql",
        "Types",
      ),
    );
  }
}

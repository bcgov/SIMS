import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddStudentCYIncomeAppeal1772752698502 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-student-current-year-income-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-Insert-student-current-year-income-appeal.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

import { getSQLFileData } from "@sims/utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDynamicFormConfig202620271766440071281
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2026-2027.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-insert-dynamic-form-configurations-2026-2027.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

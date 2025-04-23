import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateDynamicFormConfigurationsTable1745432641611
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-dynamic-form-configurations-table.sql",
        "DynamicFormConfigurations",
      ),
    );
    // Insert configurations for program year 2021-2022.
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2021-2022.sql",
        "DynamicFormConfigurations",
      ),
    );

    // Insert configurations for program year 2022-2023.
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2022-2023.sql",
        "DynamicFormConfigurations",
      ),
    );

    // Insert configurations for program year 2023-2024.
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2023-2024.sql",
        "DynamicFormConfigurations",
      ),
    );

    // Insert configurations for program year 2024-2025.
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2024-2025.sql",
        "DynamicFormConfigurations",
      ),
    );

    // Insert configurations for program year 2025-2026.
    await queryRunner.query(
      getSQLFileData(
        "Insert-dynamic-form-configurations-2025-2026.sql",
        "DynamicFormConfigurations",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-dynamic-form-configurations-table.sql",
        "DynamicFormConfigurations",
      ),
    );
  }
}

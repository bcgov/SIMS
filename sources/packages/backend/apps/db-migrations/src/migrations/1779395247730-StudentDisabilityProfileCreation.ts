import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class StudentDisabilityProfileCreation1779395247730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Insert-disability-category-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-disability-impairment-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Insert-disability-type-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Create-disability-profile-status.sql", "Types"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-student-disability-profile.sql",
        "StudentDisabilityProfiles",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-student-disability-profile-disability.sql",
        "StudentDisabilityProfileDisabilities",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-disability-system-lookup.sql",
        "SystemLookupConfigurations",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-student-disability-profile-disability.sql",
        "StudentDisabilityProfileDisabilities",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Rollback-create-student-disability-profile.sql",
        "StudentDisabilityProfiles",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Rollback-create-disability-profile-status.sql", "Types"),
    );
  }
}

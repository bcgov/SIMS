import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class PopulateParentOfferingIdToNonExistingFields1703014317163
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Update-null-parent-offering-id-as-primary-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Revert-update-null-parent-offering-id-as-primary-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class EducationProgramOfferingAddParentOfferingId1656374983988
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-parent-offering-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-parent-offering-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

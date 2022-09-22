import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class OfferingsAddUniqueConstraint1663266405594
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-offering-duplication-unique-index.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-offering-duplication-unique-index.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

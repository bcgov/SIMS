import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

const DIR = "EducationProgramsOfferings";

export class CreateOfferingIntensity1628287835629
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Create-offering-intensity.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(getSQLFileData("Drop-offering-intensity.sql", DIR));
  }
}

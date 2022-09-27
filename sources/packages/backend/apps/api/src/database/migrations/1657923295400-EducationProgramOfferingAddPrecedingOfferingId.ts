import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class EducationProgramOfferingAddPrecedingOfferingId1657923295400
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-preceding-offering-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-preceding-offering-id.sql",
        "EducationProgramsOfferings",
      ),
    );
  }
}

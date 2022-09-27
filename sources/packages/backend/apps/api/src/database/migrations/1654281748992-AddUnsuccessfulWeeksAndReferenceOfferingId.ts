import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnsuccessfulWeeksAndReferenceOfferingId1654281748992
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-unsuccessful-weeks-and-reference-offering-id.sql",
        "StudentScholasticStandings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-unsuccessful-weeks-and-reference-offering-id.sql",
        "StudentScholasticStandings",
      ),
    );
  }
}

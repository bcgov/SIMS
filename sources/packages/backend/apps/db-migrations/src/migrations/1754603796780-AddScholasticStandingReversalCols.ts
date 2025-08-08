import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddScholasticStandingReversalCols1754603796780
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-scholastic-standing-reversal-cols.sql",
        "StudentScholasticStandings",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-scholastic-standing-reversal-cols.sql",
        "StudentScholasticStandings",
      ),
    );
  }
}

import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveScholasticStandingApprovalFields1653935486735
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Remove-scholastic-standing-approval-fields.sql",
        "StudentScholasticStandings",
      ),
    );
    await queryRunner.query(
      getSQLFileData("Remove-scholastic-standing-status-enum.sql", "Types"),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Revert-scholastic-standing-status-enum.sql", "Types"),
    );
    await queryRunner.query(
      getSQLFileData(
        "Revert-remove-scholastic-standing-approval-fields.sql",
        "StudentScholasticStandings",
      ),
    );
  }
}

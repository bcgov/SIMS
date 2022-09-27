import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../../utilities";

export class CreatePartTimeSAILApplicationRecords1642195310361
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-part-time-sfas-application-records.sql",
        "SFASPartTimeApplications",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-part-time-sfas-application-records.sql",
        "SFASPartTimeApplications",
      ),
    );
  }
}

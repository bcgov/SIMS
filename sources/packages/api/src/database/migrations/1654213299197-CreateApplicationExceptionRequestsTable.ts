import { getSQLFileData } from "../../utilities";
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicationExceptionRequestsTable1654213299197
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-application-exception-requests.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-application-exception-requests.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }
}

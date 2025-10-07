import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class ApplicationExceptionRequestsAddStatusCol1759532829028
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-col-exception-request-status.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-col-exception-request-status.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }
}

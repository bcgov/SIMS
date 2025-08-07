import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AddApplicationExceptionRequestsHashAndOtherColumns1754523744752
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Add-hash-and-other-columns.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-add-hash-and-other-columns.sql",
        "ApplicationExceptionRequests",
      ),
    );
  }
}

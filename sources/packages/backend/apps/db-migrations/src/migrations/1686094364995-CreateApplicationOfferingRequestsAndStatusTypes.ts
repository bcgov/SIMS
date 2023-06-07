import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class CreateApplicationOfferingRequestsAndStatusTypes1686094364995
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Create-application-offering-change-request-status-types.sql",
        "Types",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Create-application-offering-change-requests.sql",
        "ApplicationOfferingChangeRequests",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Drop-application-offering_change-requests.sql",
        "ApplicationOfferingChangeRequests",
      ),
    );
    await queryRunner.query(
      getSQLFileData(
        "Drop-application-offering-change-request-status-types.sql",
        "Types",
      ),
    );
  }
}

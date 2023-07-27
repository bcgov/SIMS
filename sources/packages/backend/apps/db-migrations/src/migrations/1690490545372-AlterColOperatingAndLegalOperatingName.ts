import { MigrationInterface, QueryRunner } from "typeorm";
import { getSQLFileData } from "../utilities/sqlLoader";

export class AlterColOperatingAndLegalOperatingName1690490545372
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Alter-col-operating-and-legal-operating-name.sql",
        "Institution",
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData(
        "Rollback-alter-col-operating-and-legal-operating-name.sql",
        "Institution",
      ),
    );
  }
}

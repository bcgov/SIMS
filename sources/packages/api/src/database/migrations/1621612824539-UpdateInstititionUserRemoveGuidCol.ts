import { MigrationInterface, QueryRunner } from "typeorm";

import { getSQLFileData } from "../../utilities";

const DIR = "InstitutionUsers";

export class UpdateInstititionUserRemoveGuidCol1621612824539
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Just reverting changes of last migration UpdateInstitutionUser1621518770465 which is adding guid column
     */
    await queryRunner.query(
      getSQLFileData("Drop-col-institution-user-guid.sql", DIR),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      getSQLFileData("Add-col-institution-user-guid.sql", DIR),
    );
  }
}

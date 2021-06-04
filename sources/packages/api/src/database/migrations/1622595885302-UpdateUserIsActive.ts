import {MigrationInterface, QueryRunner} from "typeorm";

import { getSQLFileData } from "../../utilities";

const DIR = "User";
export class UpdateUserIsActive1622595885302 implements MigrationInterface {

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            getSQLFileData("Drop-col-user-isactive.sql", DIR),
          );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            getSQLFileData("Add-col-user-isactive.sql", DIR),
          );
    }

}

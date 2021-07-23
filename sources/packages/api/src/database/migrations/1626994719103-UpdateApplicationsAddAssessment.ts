import {MigrationInterface, QueryRunner} from "typeorm";
import { getSQLFileData } from "../../utilities";

export class UpdateApplicationsAddAssessment1626994719103 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            getSQLFileData("Add-col-assessment.sql", "Applications"),
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            getSQLFileData("Drop-col-assessment.sql", "Applications"),
          );
    }

}

import {MigrationInterface, QueryRunner} from "typeorm";
import { getSQLFileData } from '../../utilities';

export class Student1611091981943 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSQLFileData('Create-student.sql', 'Student'))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSQLFileData('Drop-student.sql', 'Student'));
    }

}

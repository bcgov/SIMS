import {MigrationInterface, QueryRunner} from 'typeorm';
import { getSQLFileData } from '../../utilities';

export class User1610712571660 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSQLFileData('Create-User.sql', 'User'))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSQLFileData('Drop-User.sql', 'User'));
    }

}

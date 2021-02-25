import * as dayjs from "dayjs";
import { Injectable } from "@nestjs/common";
import { Student } from "src/database/entities";
import { createConnection, Connection } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const config: PostgresConnectionOptions = require("../../../ormconfig");

@Injectable()
export class ArchiveDbService {
  private _connection?: Connection;

  public get connection(): Connection {
    return this._connection;
  }

  async init() {
    try {
      this._connection = await createConnection({
        type: "postgres",
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: process.env.ARCHIVE_DB || 'sfas_db',
        logging: ["error", "info", "warn"],
        migrations: ["./src/services/archive-db/migrations/*.ts"],
        synchronize: false,
        migrationsRun: false,
      })
    } catch (excp) {
      console.error(`Unable to connect archive db for ${excp}`);
      throw excp;
    }
  }

  async query<T>(raw: string, parameters?: any[]): Promise<T | null> {
    try {
      if (!this._connection) {
        await this.init();
      }
      return this._connection.query(raw, parameters);
    } catch (excp) {
      console.error(`Unable to query in archive db for ${excp}`);
      return null;
    }
  }

  async getIndividualPDStatus(student: Pick<Student, 'birthdate' | 'sin'>): Promise<any> {
    return this._connection.query("select permanent_disability_flg from public.individual where sin=$1 and date_of_birth=$2", [student.sin, dayjs(student.birthdate).format("YYYYMMDD")]);
  }

}

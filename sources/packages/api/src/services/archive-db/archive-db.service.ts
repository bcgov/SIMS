import * as dayjs from "dayjs";
import { Injectable } from "@nestjs/common";
import { Student } from "src/database/entities";
import { createConnection, Connection } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { StudentLegacyData } from "../../types";
import { Loggable, LoggerEnable } from "../../common";
import { LoggerService } from "../../logger/logger.service";

const config: PostgresConnectionOptions = require("../../../ormconfig");

@Injectable()
@LoggerEnable()
export class ArchiveDbService implements Loggable {
  private _connection?: Connection;

  constructor() {
    this.logger().log("[Created]");
  }

  public get connection(): Connection {
    return this._connection;
  }

  logger(): LoggerService | undefined {
    return;
  }

  async init() {
    if (this._connection) {
      return;
    }
    let migrations = [];
    if (process.env.NODE_ENV === "local") {
      migrations = ["./src/services/archive-db/migrations/*.ts"];
    }
    try {
      this._connection = await createConnection({
        name: "archiveDB",
        type: "postgres",
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: process.env.ARCHIVE_DB || "sfas_db",
        logging: ["error", "info", "warn"],
        migrations,
        synchronize: false,
        migrationsRun: false,
      });
    } catch (excp) {
      this.logger().error(`Unable to connect archive db for ${excp}`);
      throw excp;
    }
  }

  async query<T>(raw: string, parameters?: any[]): Promise<T | null> {
    try {
      await this.init();
      return this._connection.query(raw, parameters);
    } catch (excp) {
      this.logger().error(`Unable to query in archive db for ${excp}`);
      return null;
    }
  }

  async getIndividualPDStatus(
    student: Pick<Student, "birthdate" | "sin">,
  ): Promise<StudentLegacyData[]> {
    await this.init();
    return this._connection.query(
      "select permanent_disability_flg as disability from public.individual where sin=$1 and date_of_birth=$2",
      [student.sin, dayjs(student.birthdate).format("YYYYMMDD")],
    );
  }
}

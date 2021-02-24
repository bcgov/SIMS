import { Injectable } from "@nestjs/common";
import { createConnection, Connection } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const config: PostgresConnectionOptions = require("../../../ormconfig");

@Injectable()
export class ArchiveDbService {
  private _connection?: Connection;

  private async init() {
    try {
      this._connection = await createConnection({
        type: "postgres",
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        logging: ["error", "info", "warn"],
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

}

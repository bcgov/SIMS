import { Injectable, Inject } from "@nestjs/common";
import { LoggerService } from "../logger/logger.service";
import { Connection } from "typeorm";
import { LoggerEnable, Loggable } from "../common";

@Injectable()
@LoggerEnable()
export class DatabaseService implements Loggable {
  constructor(@Inject("Connection") public connection: Connection) {
    connection
      .query(`SET SCHEMA '${process.env.DB_SCHEMA || "sims"}';`)
      .then(() => {
        this.logger().log(
          `*** Successfully set schema ${process.env.DB_SCHEMA || "sims"}`,
        );
      });
  }

  logger(): LoggerService | undefined {
    return;
  }
}

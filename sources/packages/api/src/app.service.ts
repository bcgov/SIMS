import { Injectable } from "@nestjs/common";
import { getConnection } from "typeorm";

@Injectable()
export class AppService {
  getHello(): string {
    try {
      const connection = getConnection();

      return `Hello World! The database connection is ${
        connection.isConnected
      } and version: ${process.env.VERSION ?? "-1"}`;
    } catch (excp) {
      return `Hello world! Fail with error: ${excp}`;
    }
  }
}

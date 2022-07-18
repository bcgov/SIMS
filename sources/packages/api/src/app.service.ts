import { Injectable } from "@nestjs/common";
import { simsDataSource } from "config/ormconfig";

@Injectable()
export class AppService {
  getHello(): string {
    try {
      return `Hello World! The database dataSource is ${
        simsDataSource.isInitialized
      } and version: ${process.env.VERSION ?? "-1"}`;
    } catch (excp) {
      return `Hello world! Fail with error: ${excp}`;
    }
  }
}

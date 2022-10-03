import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}
  getHello(): string {
    try {
      return `Hello World! The database dataSource is ${
        this.dataSource.isInitialized
      } and version: ${process.env.VERSION ?? "-1"}`;
    } catch (excp) {
      return `Hello world! Fail with error: ${excp}`;
    }
  }
}

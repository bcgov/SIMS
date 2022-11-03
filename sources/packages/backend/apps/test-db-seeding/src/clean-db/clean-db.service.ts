import { Injectable, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CleanDbService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    console.info("database cleaning!!!");
    await this.dataSource.dropDatabase();
    console.info("db cleaning completed!!!!");
  }
}

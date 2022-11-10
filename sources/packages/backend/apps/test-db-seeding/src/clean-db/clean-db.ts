import { Injectable, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CleanDb implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    // Drops the database and all its data.It will erase all your database tables and their data.
    await this.dataSource.dropDatabase();
  }
}

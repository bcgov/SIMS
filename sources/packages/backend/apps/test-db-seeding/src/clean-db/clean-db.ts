import { Injectable, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CleanDb implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.dropDatabase();
  }
}

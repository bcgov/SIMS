import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CleanDatabase {
  constructor(private readonly dataSource: DataSource) {}

  async cleanDatabase(): Promise<void> {
    // Drops the database and all its data.It will erase all your database tables and their data.
    await this.dataSource.dropDatabase();
    await this.dataSource.query("DROP EXTENSION pg_trgm");
    await this.dataSource.query("DROP FUNCTION sims.create_history_entry");
  }
}

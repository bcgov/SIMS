import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CleanDatabase {
  constructor(private readonly dataSource: DataSource) {}

  async cleanDatabase(): Promise<void> {
    // Drops the database and all its data.It will erase all your database tables and their data.
    await this.dataSource.dropDatabase();
    const dropExtensionPGTRGMPromise = this.dataSource.query(
      "DROP EXTENSION IF EXISTS pg_trgm",
    );
    const dropCreateHistoryEntryFunctionPromise = this.dataSource.query(
      "DROP FUNCTION IF EXISTS sims.create_history_entry",
    );
    const dropIsValidSystemLookupKeyFunctionPromise = this.dataSource.query(
      "DROP FUNCTION IF EXISTS sims.is_valid_system_lookup_key(TEXT,TEXT)",
    );
    await Promise.all([
      dropExtensionPGTRGMPromise,
      dropCreateHistoryEntryFunctionPromise,
      dropIsValidSystemLookupKeyFunctionPromise,
    ]);
  }
}

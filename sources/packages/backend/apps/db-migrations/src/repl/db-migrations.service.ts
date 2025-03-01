import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ormConfig } from "../data-source";
import { inspect } from "util";

@Injectable()
export class DBMigrationsService {
  async rollback(): Promise<void> {
    try {
      console.info("Running rollback.");
      const dataSource = await this.createDataSource();
      await this.list(1);
      console.info(`Reverting migration.`);
      await dataSource.undoLastMigration({ fake: true });
      await dataSource.destroy();
      console.info("Migration reverted.");
    } catch (error: unknown) {
      console.error("Error rolling back migration.", inspect(error));
    }
  }

  async list(limit = 10): Promise<void> {
    try {
      const dataSource = await this.createDataSource();
      console.info(`Last ${limit} migration(s).`);
      const mostRecentMigrations = await this.getRecentMigrationRecords(
        dataSource,
        limit,
      );
      console.table(mostRecentMigrations);
      await dataSource.destroy();
    } catch (error: unknown) {
      console.error("Error listing migrations.", inspect(error));
    }
  }

  private async createDataSource() {
    const migrationDataSource = new DataSource({
      ...ormConfig,
      logging: ["error"],
    });
    return migrationDataSource.initialize();
  }

  private async getRecentMigrationRecords(dataSource: DataSource, limit = 5) {
    return await dataSource.query<string[]>(
      `SELECT * FROM sims.migrations ORDER BY id DESC LIMIT ${limit}`,
    );
  }
}

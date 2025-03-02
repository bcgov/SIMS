import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ormConfig } from "../data-source";
import { inspect } from "util";

@Injectable()
export class DBMigrationsService {
  async run(): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      console.info("Setting up data source to execute migrations.");
      await dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS ${ormConfig.schema};`,
      );
      await dataSource.query(`SET search_path TO ${ormConfig.schema}, public;`);
      await dataSource.query(`SET SCHEMA '${ormConfig.schema}';`);
      console.info("Running migrations.");
      await dataSource.runMigrations();
      console.info("All migrations executed.");
    });
  }

  async rollback(): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      console.info("Running rollback.");
      await this.list(1);
      console.info(`Reverting migration.`);
      await dataSource.undoLastMigration({ fake: true });
      console.info("Migration reverted.");
    });
  }

  async list(limit = 5): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      if (limit === 1) {
        console.info("Latest migration executed.");
      } else {
        console.info(`List of latest ${limit} migrations.`);
      }
      const mostRecentMigrations = await this.getRecentMigrationRecords(
        dataSource,
        limit,
      );
      console.table(mostRecentMigrations);
    });
  }

  private async executeDBOperation(
    operation: (sataSource: DataSource) => Promise<void>,
  ): Promise<void> {
    const migrationDataSource = new DataSource(ormConfig);
    const dataSource = await migrationDataSource.initialize();
    try {
      await operation(dataSource);
    } catch (error: unknown) {
      console.error("Error listing migrations.", inspect(error));
    } finally {
      await dataSource.destroy();
    }
  }

  private async getRecentMigrationRecords(dataSource: DataSource, limit = 5) {
    return dataSource.query<string[]>(
      `SELECT * FROM ${ormConfig.schema}.migrations ORDER BY id DESC LIMIT ${limit}`,
    );
  }
}

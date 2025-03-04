import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ormConfig } from "./data-source";
import { inspect } from "util";

/**
 * DB migrations options available.
 * Each operation is executed in an isolated data source.
 */
@Injectable()
export class DBMigrationsService {
  private readonly logger = new Logger("DB Migration Command");

  /**
   * Run all pending migrations.
   */
  async run(): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      this.logger.log("Setting up data source to execute migrations.");
      await dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS ${ormConfig.schema};`,
      );
      await dataSource.query(`SET search_path TO ${ormConfig.schema}, public;`);
      await dataSource.query(`SET SCHEMA '${ormConfig.schema}';`);
      this.logger.log("Running migrations.");
      await dataSource.runMigrations();
      this.logger.log("All migrations executed.");
    });
  }

  /**
   * Revert the last migration.
   */
  async revert(): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      this.logger.log("Running rollback.");
      this.logger.warn("The below is the migration being reverted.");
      await this.list(1);
      this.logger.log(`Reverting migration.`);
      await dataSource.undoLastMigration();
      this.logger.log("Migration reverted.");
      this.logger.warn("The below is the latest migration now.");
      await this.list(1);
    });
  }

  /**
   * List the latest migrations.
   * @param limit number of latest migrations to list.
   */
  async list(limit = 5): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      const mostRecentMigrations = await this.getRecentMigrationRecords(
        dataSource,
        limit,
      );
      console.table(mostRecentMigrations);
    });
  }

  /**
   * Executes a database operation within a data source context.
   * @param operation the operation to execute.
   */
  private async executeDBOperation(
    operation: (sataSource: DataSource) => Promise<void>,
  ): Promise<void> {
    const migrationDataSource = new DataSource(ormConfig);
    const dataSource = await migrationDataSource.initialize();
    try {
      await operation(dataSource);
    } catch (error: unknown) {
      this.logger.error("Error listing migrations.", inspect(error));
    } finally {
      await dataSource.destroy();
    }
  }

  /**
   * Retrieves recent migration records from the database.
   * @param dataSource data source to execute the query.
   * @param limit number of latest migrations to return.
   * @returns database results.
   */
  private async getRecentMigrationRecords(
    dataSource: DataSource,
    limit = 5,
  ): Promise<unknown> {
    return dataSource.query<string[]>(
      `SELECT * FROM ${ormConfig.schema}.migrations ORDER BY id DESC LIMIT ${limit}`,
    );
  }
}

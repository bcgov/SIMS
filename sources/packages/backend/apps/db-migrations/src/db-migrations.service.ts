import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ormConfig } from "./data-source";

/**
 * Default limit to use when listing migrations.
 */
const DEFAULT_LIST_LIMIT = 5;

/**
 * DB migrations options available.
 * Each operation is executed in an isolated data source.
 * When an operation fails, the data source is destroyed and the error
 * will be logged to the console while the REPL will continue to run.
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
  async list(limit = DEFAULT_LIST_LIMIT): Promise<void> {
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
    operation: (dataSource: DataSource) => Promise<void>,
  ): Promise<void> {
    let dataSource: DataSource;
    try {
      const migrationDataSource = new DataSource(ormConfig);
      dataSource = await migrationDataSource.initialize();
      await operation(dataSource);
    } finally {
      await dataSource?.destroy();
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

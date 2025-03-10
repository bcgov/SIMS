import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ormConfig } from "./data-source";
import { inspect } from "util";

/**
 * Default limit to use when listing migrations.
 */
export const DEFAULT_LIST_LIMIT = 5;

/**
 * Behavior to use when a failure occurs.
 * Useful to control the behavior when the migration is executed
 * in the CI/CD pipeline or using the REPL mode.
 */
export enum FailureBehavior {
  /**
   * Only log the error and continue.
   */
  LogOnly = "log-only",
  /**
   * Rethrow the error.
   */
  Rethrow = "rethrow",
}

/**
 * DB migrations options available.
 * Each operation is executed in an isolated data source.
 */
@Injectable()
export class DBMigrationsService {
  private readonly logger = new Logger("DB Migration Command");

  /**
   * Run all pending migrations.
   * @param failureBehavior the behavior to use when a failure occurs.
   * Defaults to log only.
   */
  async run(failureBehavior = FailureBehavior.LogOnly): Promise<void> {
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
    }, failureBehavior);
  }

  /**
   * Revert the last migration.
   * @param failureBehavior the behavior to use when a failure occurs.
   * Defaults to log only.
   */
  async revert(failureBehavior = FailureBehavior.LogOnly): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      this.logger.log("Running rollback.");
      this.logger.warn("The below is the migration being reverted.");
      await this.list(1);
      this.logger.log(`Reverting migration.`);
      await dataSource.undoLastMigration();
      this.logger.log("Migration reverted.");
      this.logger.warn("The below is the latest migration now.");
      await this.list(1);
    }, failureBehavior);
  }

  /**
   * List the latest migrations.
   * @param limit number of latest migrations to list.
   * @param failureBehavior the behavior to use when a failure occurs.
   * Defaults to log only.
   */
  async list(
    limit = DEFAULT_LIST_LIMIT,
    failureBehavior = FailureBehavior.LogOnly,
  ): Promise<void> {
    await this.executeDBOperation(async (dataSource) => {
      const mostRecentMigrations = await this.getRecentMigrationRecords(
        dataSource,
        limit,
      );
      console.table(mostRecentMigrations);
    }, failureBehavior);
  }

  /**
   * Executes a database operation within a data source context.
   * @param operation the operation to execute.
   * @param failureBehavior the behavior to use when a failure occurs.
   * Defaults to log only.
   */
  private async executeDBOperation(
    operation: (dataSource: DataSource) => Promise<void>,
    failureBehavior = FailureBehavior.LogOnly,
  ): Promise<void> {
    const migrationDataSource = new DataSource(ormConfig);
    const dataSource = await migrationDataSource.initialize();
    try {
      await operation(dataSource);
    } catch (error: unknown) {
      if (failureBehavior === FailureBehavior.LogOnly) {
        this.logger.error(
          "Error executing migration operation.",
          inspect(error),
        );
        return;
      }
      throw error;
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

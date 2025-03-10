import { NestFactory, repl } from "@nestjs/core";
import { REPLModule } from "./repl.module";
import { DBMigrationsModule } from "./db-migrations.module";
import {
  DBMigrationsService,
  DEFAULT_LIST_LIMIT,
  FailureBehavior,
} from "./db-migrations.service";
import { Logger } from "@nestjs/common";

/**
 * Available arguments to execute the DB Migrations.
 */
enum InitArguments {
  /**
   * Read-Eval-Print-Loop (REPL) mode.
   */
  REPL = "repl",
  /**
   * Execute all pending migrations.
   */
  Run = "run",
  /**
   * Revert the last migration
   */
  Revert = "revert",
  /**
   * List the latest migrations.
   */
  List = "list",
}

(async () => {
  const logger = new Logger("DB Migration");
  logger.log("DB Migrations started.");
  // One and only one argument is expected at this time.
  // Slice to remove 'node' and script path.
  const [initArg] = process.argv.slice(2);
  if (initArg === InitArguments.REPL) {
    await repl(REPLModule);
    return;
  }
  const app = await NestFactory.createApplicationContext(DBMigrationsModule);
  await app.init();
  const migrationsService = app.get(DBMigrationsService);
  switch (initArg) {
    case InitArguments.Run:
      await migrationsService.run(FailureBehavior.Rethrow);
      break;
    case InitArguments.Revert:
      await migrationsService.revert(FailureBehavior.Rethrow);
      break;
    case InitArguments.List:
      await migrationsService.list(DEFAULT_LIST_LIMIT, FailureBehavior.Rethrow);
      break;
    default:
      logger.warn(
        `Invalid argument. Available arguments are: ${Object.values(
          InitArguments,
        )}.`,
      );
      break;
  }
  await app.close();
  logger.log("DB Migrations closed.");
})();

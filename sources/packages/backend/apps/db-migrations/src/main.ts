import { NestFactory, repl } from "@nestjs/core";
import { REPLModule } from "./repl.module";
import { DBMigrationsModule } from "./db-migrations.module";
import { DBMigrationsService } from "./db-migrations.service";
import { Logger } from "@nestjs/common";

(async () => {
  const logger = new Logger("DB Migration");
  logger.log("DB Migrations started.");
  // One and only one argument is expected at this time.
  // Slice to remove 'node' and script path.
  const [initArg] = process.argv.slice(2);
  if (initArg === "repl") {
    await repl(REPLModule);
    return;
  }
  const app = await NestFactory.create(DBMigrationsModule);
  await app.init();
  switch (initArg) {
    case "run":
      await app.get(DBMigrationsService).run();
      break;
    case "revert":
      await app.get(DBMigrationsService).revert();
      break;
    case "list":
      await app.get(DBMigrationsService).list();
      break;
    default:
      logger.warn("Invalid argument. Please use run, revert, or list.");
      break;
  }
  await app.close();
  logger.log("DB Migrations closed.");
})();

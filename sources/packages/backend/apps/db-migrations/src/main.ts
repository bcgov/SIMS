import { Logger } from "@nestjs/common";
import { DBMigrationsService } from "./repl/db-migrations.service";

(async () => {
  const logger = new Logger();
  logger.log("Starting migration process.");
  const migrationsService = new DBMigrationsService();
  await migrationsService.run();
})();

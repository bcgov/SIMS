import { DBMigrationsService } from "./repl/db-migrations.service";

(async () => {
  console.info("Starting migration process.");
  const migrationsService = new DBMigrationsService();
  await migrationsService.run();
})();

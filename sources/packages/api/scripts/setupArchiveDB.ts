require("../env_setup");
import { Connection } from "typeorm";
import { ArchiveDbService } from "../src/services/archive-db/archive-db.service";
/**
 * Main Async Execution method
 */
(async () => {
  // 1. Get Service and create connection 
  const service = new ArchiveDbService();
  await service.init();
  const connection: Connection = service.connection;
  // 2. Revert last migration because this connection has only one migration
  try {
    await connection.undoLastMigration({ transaction: "all" });
    console.log("Revert [SUCCESS]");
  } catch (excp) {
    console.log(`Revert exception: ${excp}`);
  }
  // 3. Run migrations
  await connection.runMigrations({ transaction: "all" });

  console.log("Migration [SUCCESS]");

  // 4. Close connection
  await connection.close();
})();
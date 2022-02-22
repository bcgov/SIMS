require("../env_setup");
import { createConnection } from "typeorm";
const config = require("../ormconfig");

/**
 * Script main execution method
 */
(async () => {
  try {
    // Create Connection
    console.log("**** Running setupDB ****");
    const connection = await createConnection({
      ...config,
      logging: ["error", "warn", "info"],
    });
    await connection.query(`CREATE SCHEMA IF NOT EXISTS ${config.schema};`);
    await connection.query(`SET search_path TO ${config.schema}, public;`);
    await connection.query(`SET SCHEMA '${config.schema}';`);
    console.log(`**** Running migration ****`);
    await connection.runMigrations();
    await connection.close();
    console.log(`**** Running setupDB: [Complete] ****`);
  } catch (error) {
    console.error(`Exception occurs during setup db process: ${error}`);
    console.dir(config);
    throw error;
  }
})();

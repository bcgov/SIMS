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
    delete config.schema;
    delete config.entities;
    const connection = await createConnection({
      ...config,
      logging: ["error", "warn", "info"],
    });
    const schema = process.env.DB_SCHEMA || "sims";
    await connection.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
    await connection.query(`SET search_path TO ${schema}, public;`);
    await connection.query(`SET SCHEMA '${schema}';`);
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

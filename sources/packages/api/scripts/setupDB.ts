require("../env_setup");
import { DataSource } from "typeorm";
import { ormConfig } from "../src/database/data-source";

/**
 * Script main execution method
 */
(async () => {
  const migrationDataSource = new DataSource({
    ...ormConfig,
    logging: ["error", "warn", "info"],
  });
  const dataSource = await migrationDataSource.initialize();
  try {
    // Create DataSource
    console.log("**** Running setupDB ****");
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${ormConfig.schema};`);
    await dataSource.query(`SET search_path TO ${ormConfig.schema}, public;`);
    await dataSource.query(`SET SCHEMA '${ormConfig.schema}';`);
    console.log(`**** Running migration ****`);
    await dataSource.runMigrations();
    console.log(`**** Running setupDB: [Complete] ****`);
  } catch (error) {
    console.error(`Exception occurs during setup db process: ${error}`);
    console.dir(ormConfig);
    throw error;
  } finally {
    await dataSource.destroy();
  }
})();

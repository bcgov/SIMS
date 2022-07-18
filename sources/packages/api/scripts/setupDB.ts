import ormConfig, { simsDataSource } from "config/ormconfig";

/**
 * Script main execution method
 */
(async () => {
  try {
    // Create DataSource
    console.log("**** Running setupDB ****");
    const connection = await simsDataSource.initialize();
    await connection.query(`CREATE SCHEMA IF NOT EXISTS ${ormConfig.schema};`);
    await connection.query(`SET search_path TO ${ormConfig.schema}, public;`);
    await connection.query(`SET SCHEMA '${ormConfig.schema}';`);
    console.log(`**** Running migration ****`);
    await connection.runMigrations();
    await connection.destroy();
    console.log(`**** Running setupDB: [Complete] ****`);
  } catch (error) {
    console.error(`Exception occurs during setup db process: ${error}`);
    console.dir(ormConfig);
    throw error;
  }
})();

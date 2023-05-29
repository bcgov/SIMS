import { DataSource } from "typeorm";
import { ormConfig } from "./data-source";

async function bootstrap() {
  const migrationDataSource = new DataSource({
    ...ormConfig,
    logging: ["error", "warn", "info"],
  });
  const dataSource = await migrationDataSource.initialize();
  try {
    console.info("**** Running setupDB ****");
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${ormConfig.schema};`);
    await dataSource.query(`SET search_path TO ${ormConfig.schema}, public;`);
    await dataSource.query(`SET SCHEMA '${ormConfig.schema}';`);
    console.info(`**** Running migration ****`);
    await dataSource.runMigrations();
    console.info(`**** Running setupDB: [Complete] ****`);
  } catch (error) {
    console.error(`Exception occurs during setup db process: ${error}`);
    console.dir(ormConfig);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}
(async () => {
  await bootstrap();
})();

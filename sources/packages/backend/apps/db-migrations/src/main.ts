import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const ormConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.DB_SCHEMA || "sims",
  synchronize: false,
  migrations: ["apps/db-migrations/src/migrations/*{.ts,.js}"],
};

async function bootstrap() {
  const migrationDataSource = new DataSource({
    ...ormConfig,
    logging: ["error", "warn", "info"],
  });
  const dataSource = await migrationDataSource.initialize();
  try {
    console.info(ormConfig);
    // Create DataSource
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
bootstrap();

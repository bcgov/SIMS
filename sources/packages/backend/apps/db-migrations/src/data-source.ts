import "../../../env-setup";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export const ormConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.DB_SCHEMA || "sims",
  synchronize: false,
  migrations: ["apps/db-migrations/src/migrations/*{.ts,.js}"],
  logging: ["error", "warn"],
};


const directLoad = (process.env.ENVIRONMENT === "test" || process.env.NODE_ENV === "cmd")

const entities = directLoad ? ["src/database/entities/*.model{.ts,.js}"] : ["dist/database/entities/*.model{.ts,.js}"];

const migrations = directLoad ? ["src/database/migrations/*{.ts,.js}"] : ["dist/database/migrations/*{.ts,.js}"];

module.exports = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  synchronize: false,
  migrations,
  cli: {
    migrationsDir: "src/database/migrations",
    entitiesDir: "src/database/entities"
  },
  entities,
  schema: process.env.DB_SCHEMA || "sims",
};

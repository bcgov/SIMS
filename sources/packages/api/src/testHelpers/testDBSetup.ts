import { createConnection, getConnection } from "typeorm";

const config = require("../../ormconfig");

export async function setupDB() {
  try {
    const connection = await createConnection({
      ...config,
      logging: ["error", "warn", "info"],
    });
    return connection;
  } catch (excp) {
    console.error(`Exception to connected db: ${excp}`);
    console.dir(config);
  }
}

export async function closeDB() {
  const connection = getConnection();
  await connection.close();
}

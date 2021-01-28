import { createConnection, getConnection } from "typeorm";
const config = require("../../ormconfig");

export async function setupDB() {
  const connection = await createConnection({
    ...config,
    logging: ['error', 'warn'],
  });
  return connection;
} 

export async function closeDB() {
  const connection = getConnection();
  await connection.close();
}
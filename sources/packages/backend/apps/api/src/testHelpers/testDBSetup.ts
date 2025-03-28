import { simsDataSource } from "@sims/sims-db";

export async function setupDB() {
  try {
    return simsDataSource.initialize();
  } catch (excp) {
    console.error(`Exception to connected db: ${excp}`);
  }
}

export async function closeDB() {
  await simsDataSource.destroy();
}

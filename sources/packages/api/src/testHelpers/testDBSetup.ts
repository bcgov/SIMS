import { ormConfig, simsDataSource } from "../database/data-source";

export async function setupDB() {
  try {
    return simsDataSource.initialize();
  } catch (excp) {
    console.error(`Exception to connected db: ${excp}`);
    console.dir(ormConfig);
  }
}

export async function closeDB() {
  await simsDataSource.destroy();
}

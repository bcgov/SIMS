import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const sqlDirPath = "apps/db-migrations/src/sql";

/**
 * @description Get SQL dir path
 * @returns The SQL files container dir from resources folder
 */
export const getSQLDirPath = () => resolve(sqlDirPath);

/**
 * @description Get SQL file content
 * @param fileName
 * @param subDirPath The optional sub dir paths
 * @returns Raw string content of file
 */
export const getSQLFileData = (fileName: string, subDirPath?: string) => {
  let path = `${getSQLDirPath()}`;
  if (subDirPath) {
    path = `${path}/${subDirPath}/${fileName}`;
  } else {
    path = `${path}/${fileName}`;
  }
  if (existsSync(path)) {
    return readFileSync(path, { encoding: "utf8" });
  } else {
    throw new Error(`getSQLFileData: No file exists in path: ${path}`);
  }
};

import * as fs from "fs";
import * as path from "path";

const sqlDirPath = "src-sql";

/**
 * @description Get SQL dir path
 * @returns The SQL files container dir from resources folder
 */
export const getSQLDirPath = () =>
  path.resolve(__dirname, `../../${sqlDirPath}`);

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
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, { encoding: "utf8" });
  } else {
    throw new Error(`getSQLFileData: No file exists in path: ${path}`);
  }
};

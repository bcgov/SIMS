import { existsSync } from "node:fs";

// Target module
import { getSQLDirPath, getSQLFileData } from "./sqlLoader";

describe("Test SQL Loader", () => {
  it("should exist sql dir", () => {
    expect(existsSync(getSQLDirPath()));
  });

  it("should get sql file data", () => {
    // Read test.sql file
    const expected = "-- ## This is an empty test sql file.";
    const result = getSQLFileData("test.sql");
    expect(result).toEqual(expected);
  });
});

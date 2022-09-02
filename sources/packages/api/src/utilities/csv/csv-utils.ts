import { parseString } from "@fast-csv/parse";
import { ParserOptionsArgs } from "fast-csv";

export function parseCSVContent(
  csvString: string,
  options?: ParserOptionsArgs | undefined,
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const parsedRows: unknown[] = [];
    parseString(csvString, options)
      .on("error", (error) => reject(error))
      .on("data", (row) => parsedRows.push(row))
      .on("end", () => resolve(parsedRows));
  });
}

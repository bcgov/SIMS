import { appendByteOrderMark } from "@sims/utilities";
import { Response } from "express";
import { Readable } from "stream";

/**
 * Streams a file to the response.
 * @param response express response.
 * @param fileName file name that will be presented to the user for download.
 * @param options optional parameters.
 * - `fileContent` file content to be downloaded.
 * - `contentType - MIME type of the file. Defaults to 'text/csv'.
 */
export function streamFile(
  response: Response,
  fileName: string,
  options?: { fileContent?: string; contentType?: string },
): void {
  const contentType = options?.contentType ?? "text/csv";
  // Adding byte order mark characters to the original file content as applications
  // like excel would look for BOM characters to view the file as UTF8 encoded.
  // Append byte order mark characters only if the file content is not empty.
  const responseBuffer = options?.fileContent
    ? appendByteOrderMark(options.fileContent)
    : Buffer.from("");
  response.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  response.setHeader("Content-Type", contentType);
  response.setHeader("Content-Length", responseBuffer.byteLength);
  const stream = new Readable();
  stream.push(responseBuffer);
  stream.push(null);
  stream.pipe(response);
}

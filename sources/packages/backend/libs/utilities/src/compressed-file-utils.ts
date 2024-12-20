import * as AdmZip from "adm-zip";

/**
 * Reads the first extracted file from a compressed archive file.
 * @param compressedFileBuffer
 * @param options options.
 * - `encoding`: encoding to read the file.
 * @returns first extracted file name and data.
 */
export function readFirstExtractedFile(
  compressedFileBuffer: Buffer,
  options?: { encoding: string },
): {
  fileName: string;
  data: string;
} {
  const zipFile = new AdmZip(compressedFileBuffer);
  const [firstExtractedFile] = zipFile.getEntries();
  if (!firstExtractedFile) {
    throw new Error("No files found in zip file");
  }
  // Read the first extracted file with the specified encoding.
  const data = zipFile.readAsText(firstExtractedFile, options?.encoding);
  return {
    fileName: firstExtractedFile.name,
    data,
  };
}

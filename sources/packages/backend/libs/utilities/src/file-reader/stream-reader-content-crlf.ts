import * as unzipper from "unzipper";
import * as readline from "node:readline";

/**
 * Processes a readable stream line by line, supporting both compressed (zip) and uncompressed files.
 * For compressed files, it reads the zip entries and processes file entries line by line.
 * The fileLineProcessor callback is invoked for each non-empty line, along with the current progress percentage if available.
 * @param input readable stream to process.
 * @param fileLineProcessor callback invoked for each non-empty line.
 * @param options options to configure the processing behavior.
 * - `isCompressed`: indicates if the input stream is a zip file containing one or more files to process.
 * Only a single file entry will be processed if the zip contains multiple entries.
 * - `fileSize`: total file size in bytes used to calculate progress, if available.
 * For compressed files, this should be the size of the zip file.
 */
export async function processStreamLineByLine(
  input: NodeJS.ReadableStream,
  fileLineProcessor: (line: string, progress?: number) => Promise<void> | void,
  options: { isCompressed?: boolean; fileSize?: number },
): Promise<void> {
  const getProgress = trackProgress(input, options.fileSize);
  if (options.isCompressed) {
    const zipStream = input.pipe(
      unzipper.Parse({ forceStream: true }),
    ) as AsyncIterable<unzipper.Entry>;
    // Read the zip file entries one by one and process file entries line by line.
    for await (const entry of zipStream) {
      if (entry.type !== "File") {
        // Allow only file entries, skip directories or other types of entries.
        // Drain the entry stream to avoid hanging the unzip process.
        entry.autodrain();
        continue;
      }
      await readLinesFromStream(entry, fileLineProcessor, getProgress);
    }
    return;
  }
  await readLinesFromStream(input, fileLineProcessor, getProgress);
}

/**
 * Reads lines from a readable stream and invokes the processor for each non-empty line,
 * supporting both Windows (\r\n) and Unix (\n) line endings.
 * @param input readable stream to read lines from.
 * @param fileLineProcessor callback invoked for each non-empty line.
 * @param getProgress callback that returns the current progress percentage, if available.
 */
async function readLinesFromStream(
  input: NodeJS.ReadableStream,
  fileLineProcessor: (line: string, progress?: number) => Promise<void> | void,
  getProgress: () => number | undefined,
): Promise<void> {
  const lineReader = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });
  for await (const line of lineReader) {
    if (line.length > 0) {
      // Once a line is received, invoke the processor callback with the line content and current progress.
      // The getProgress callback allows the processor to access the current progress percentage.
      await fileLineProcessor(line, getProgress());
    }
  }
}

/**
 * Attaches a data listener to track the percentage of bytes received from a stream.
 * @param input readable stream to track.
 * @param fileSize total file size in bytes used to calculate progress, if available.
 * @returns callback that returns the current progress percentage, or undefined when the file size is unknown.
 */
function trackProgress(
  input: NodeJS.ReadableStream,
  fileSize?: number,
): () => number | undefined {
  let bytesReceived = 0;
  input.on("data", (chunk: Buffer) => {
    bytesReceived += chunk.length;
  });
  return () =>
    fileSize ? Math.round((bytesReceived / fileSize) * 100) : undefined;
}

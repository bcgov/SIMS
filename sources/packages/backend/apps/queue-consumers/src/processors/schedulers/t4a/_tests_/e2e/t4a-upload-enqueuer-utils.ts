import * as Client from "ssh2-sftp-client";
import { uuidV4Matcher } from "@sims/test-utils/matchers";
import { join } from "path";

/**
 * Create a T4A file name based on the number of files and the file number.
 * For example, for fileNumber 5, it will return 000000005.pdf
 * @param fileNumber File number to create the name.
 * @returns T4A file name.
 */
function createT4AFileName(fileNumber: number): string {
  return `${fileNumber.toString().padStart(9, "0")}.pdf`;
}

/**
 * Creates a list of SFTP file info objects to be returned by the SFTP mock.
 * @param numberOfFiles Number of files to be created in the result.
 * @returns An array of SFTP FileInfo objects.
 */
export function createSFTPListFilesResult(
  numberOfFiles: number,
): Client.FileInfo[] {
  return Array.from(
    { length: numberOfFiles },
    (_, i) =>
      ({
        name: createT4AFileName(i),
      }) as Client.FileInfo,
  );
}

/**
 * Creates a T4AUploadQueueInDTO for test validation using jest matchers.
 * @param referenceDate Reference date expected to be the same for all files.
 * @param folderName Folder name where the files are located.
 * @param options Additional options for file creation.
 * - `numberOfFiles` - Number of files to be created.
 * - `startingIndex` - Index to start the file numbering (default: 0).
 * @returns Object for validation.
 */
export function createT4AUploadQueueInDTO(
  referenceDate: Date,
  folderName: string,
  options: {
    numberOfFiles: number;
    startingIndex?: number;
  },
): unknown {
  const startingIndex = options.startingIndex ?? 0;
  const files = Array.from({ length: options.numberOfFiles }, (_, i) => ({
    relativeFilePath: join(folderName, createT4AFileName(i + startingIndex)),
    uniqueID: uuidV4Matcher,
  }));
  return {
    data: {
      referenceDate,
      files,
    },
  };
}

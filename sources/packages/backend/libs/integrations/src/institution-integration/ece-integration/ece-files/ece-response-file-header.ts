import { ECEResponseFileRecord } from "./ece-response-file-record";

/**
 * ECE response file header.
 * Read and parse the header record of ECE response file.
 */
export class ECEResponseFileHeader extends ECEResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
}

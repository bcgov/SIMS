import { ECEResponseFileRecord } from "./ece-response-file-record";

/**
 * ECE response file footer.
 * Read and parse the footer record of ECE response file.
 */
export class ECEResponseFileFooter extends ECEResponseFileRecord {
  constructor(line: string) {
    super(line);
  }

  /**
   * Total count of detail records in the file.
   */
  get totalDetailRecords(): number {
    return +this.line.substring(1, 7);
  }
}

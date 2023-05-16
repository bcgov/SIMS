import { ECEResponseFileRecord } from "./ece-response-file-record";

/**
 * Disbursement receipt header record.
 * The header record is parsed to get the batch run date which is the processing date of the file.
 */
export class ECEResponseFileHeader extends ECEResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
}

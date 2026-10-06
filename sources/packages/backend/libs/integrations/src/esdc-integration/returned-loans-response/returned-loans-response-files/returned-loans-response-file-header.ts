import { ReturnedLoansResponseFileRecord } from "./returned-loans-response-file-record";

/**
 * Returned loans response file header.
 */
export class ReturnedLoansResponseFileHeader extends ReturnedLoansResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
}

import { ReturnedLoansResponseFileRecord } from "./returned-loans-response-file-record";

/**
 * Returned loans response file footer.
 */
export class ReturnedLoansResponseFileFooter extends ReturnedLoansResponseFileRecord {
  constructor(line: string) {
    super(line);
  }

  /**
   * Count of number of detail records.
   */
  get totalDetailRecords(): number {
    return Number.parseInt(this.line.substring(2, 8));
  }
}

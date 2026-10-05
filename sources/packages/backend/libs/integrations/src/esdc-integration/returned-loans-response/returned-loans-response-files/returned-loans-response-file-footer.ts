import { ReturnedLoansResponseFileRecord } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-record";

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
    return parseInt(this.line.substring(2, 8));
  }
}

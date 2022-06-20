import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

/**
 * Disbursement receipt header record.
 * The header record is parsed to get the batch run date which is the processing date of the file.
 */
export class DisbursementReceiptHeader extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get batchRunDate() {
    return this.convertToDateRecord(this.line.substring(24, 32));
  }
}

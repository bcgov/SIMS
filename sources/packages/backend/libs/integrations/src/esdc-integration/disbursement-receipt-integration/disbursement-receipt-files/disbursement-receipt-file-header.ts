import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

/**
 * Disbursement receipt header record.
 * The header record is parsed to get the batch run date which is the processing date of the file.
 */
export class DisbursementReceiptHeader extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  get sequenceNumber() {
    return this.convertToAmount(this.line.substring(11, 16));
  }

  get fileDate() {
    return this.convertToDateRecord(this.line.substring(16, 24));
  }

  get batchRunDate() {
    return this.convertToDateRecord(this.line.substring(24, 32));
  }
}

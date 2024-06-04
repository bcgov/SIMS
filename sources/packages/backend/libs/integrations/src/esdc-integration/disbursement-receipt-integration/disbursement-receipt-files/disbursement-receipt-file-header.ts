import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

/**
 * Disbursement receipt header record.
 * The header record is parsed to get the batch run date which is the processing date of the file.
 */
export class DisbursementReceiptHeader extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  /**
   * Sequence number.
   * This reflects sequence number as produced by NSLSC report.
   */
  get sequenceNumber() {
    return this.convertToAmount(this.line.substring(11, 16));
  }

  /**
   * File date.
   * This reflects the date when the NSLSC file was produced.
   */
  get fileDate() {
    return this.convertToDateRecord(this.line.substring(16, 24));
  }

  /**
   * Batch run date.
   * Effective date of data on the disbursement receipt file.
   */
  get batchRunDate() {
    return this.convertToDateRecord(this.line.substring(24, 32));
  }
}

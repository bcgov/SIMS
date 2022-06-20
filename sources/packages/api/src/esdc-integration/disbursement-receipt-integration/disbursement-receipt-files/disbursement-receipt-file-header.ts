import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

export class DisbursementReceiptHeader extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get batchRunDate() {
    return this.convertToDateRecord(this.line.substring(24, 32));
  }
}

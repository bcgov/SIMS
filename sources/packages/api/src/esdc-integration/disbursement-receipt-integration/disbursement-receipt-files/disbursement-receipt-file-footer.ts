import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

export class DisbursementReceiptFooter extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get sinHashTotal() {
    return parseInt(this.line.substring(79, 94));
  }
}

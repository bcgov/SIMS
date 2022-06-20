import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

/**
 * Disbursement receipt trailer record.
 * The trailer record is parsed to get the SIN has to perform validation.
 */
export class DisbursementReceiptFooter extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get sinHashTotal() {
    return parseInt(this.line.substring(79, 94));
  }
}

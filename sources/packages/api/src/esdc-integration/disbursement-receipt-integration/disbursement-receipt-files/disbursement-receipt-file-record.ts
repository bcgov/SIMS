import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";
import { DisbursementReceiptRecordType } from "../models/disbursement-receipt-integration.model";

export class DisbursementReceiptRecord {
  constructor(
    protected readonly line: string,
    public readonly lineNumber = 0,
  ) {}

  public get recordType(): DisbursementReceiptRecordType {
    return this.line.substring(10, 11) as DisbursementReceiptRecordType;
  }

  protected convertToDateRecord(dateText: string) {
    return getDateOnlyFromFormat(dateText, DATE_FORMAT);
  }

  protected convertToAmountString(amountText: string) {
    const amountWholeValue = amountText.substring(0, 5);
    const amountDecimalValue = amountText.substring(5, 7);
    const wholeValue = isNaN(+amountWholeValue) ? "0" : amountWholeValue;
    const amount = isNaN(+amountDecimalValue)
      ? `${wholeValue}.00`
      : `${wholeValue}.${amountDecimalValue}`;
    return parseFloat(amount).toFixed(2);
  }
}

import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";
import { DisbursementReceiptRecordType } from "../models/disbursement-receipt-integration.model";

/**
 * Base class for disbursement receipt record.
 * All the records of disbursement receipt must be a sub class of this.
 */
export class DisbursementReceiptRecord {
  constructor(
    protected readonly line: string,
    protected readonly _lineNumber = 0,
  ) {}

  public get lineNumber(): number {
    return this._lineNumber;
  }

  public get recordType(): DisbursementReceiptRecordType {
    return this.line.substring(10, 11) as DisbursementReceiptRecordType;
  }

  /**
   * Any date record as string is parsed to date object.
   * @param dateText
   * @returns Date object.
   */
  protected convertToDateRecord(dateText: string) {
    return getDateOnlyFromFormat(dateText, DATE_FORMAT);
  }

  /**
   * Parses any amount field to numeric string by ignoring any junk character is present in data.
   ** parseFloat is used to convert string like 00520.00 to 520.00.
   * @param amountText
   * @returns amount value as numeric string.
   */
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

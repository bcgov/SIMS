import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";
import { DisbursementReceiptRecordType } from "../models/disbursement-receipt-integration.model";

/**
 * Base class for disbursement receipt record.
 * All the records of disbursement receipt must be a sub class of this.
 */
export abstract class DisbursementReceiptRecord {
  constructor(
    protected readonly line: string,
    protected readonly _lineNumber = 0,
  ) {}

  get lineNumber(): number {
    return this._lineNumber;
  }

  get recordType(): DisbursementReceiptRecordType {
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
   * Parses any amount field to numeric string.
   ** parseInt is used to convert string like 00520 to 520.
   * @param amountText
   * @returns amount value as numeric string.
   */
  protected convertToAmountString(amountText: string) {
    const amountWholeValue = amountText.substring(0, 5);
    return parseInt(amountWholeValue).toString();
  }
}

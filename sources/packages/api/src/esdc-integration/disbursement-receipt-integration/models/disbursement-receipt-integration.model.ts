import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";
export enum DisbursementReceiptRecordType {
  Header = "F",
  Detail = "D",
  Trailer = "T",
}

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

    const amount = isNaN(+amountDecimalValue)
      ? `${amountWholeValue}.00`
      : `${amountWholeValue}.${amountDecimalValue}`;
    return parseFloat(amount).toFixed(2);
  }
}

export class DisbursementReceiptHeader extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get batchRunDate() {
    return this.convertToDateRecord(this.line.substring(24, 32));
  }
}

export class DisbursementReceiptFooter extends DisbursementReceiptRecord {
  constructor(line: string) {
    super(line);
  }

  public get sinHashTotal() {
    return parseInt(this.line.substring(79, 94));
  }
}

export class DisbursementReceiptGrant {
  constructor(
    public readonly grantType: string,
    public readonly grantAmount: string,
  ) {}
}

export class DisbursementReceiptDetail extends DisbursementReceiptRecord {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  private GRANT_OCCURRENCE = 10;

  public get studentSIN() {
    return this.line.substring(14, 23);
  }

  public get fundingType() {
    return this.line.substring(23, 25);
  }

  public get documentNumber() {
    return parseInt(this.line.substring(25, 37));
  }

  public get totalEntitledDisbursedAmount() {
    return this.convertToAmountString(this.line.substring(37, 44));
  }

  public get totalDisbursedAmount() {
    return this.convertToAmountString(this.line.substring(44, 51));
  }

  public get disburseDate() {
    return this.convertToDateRecord(this.line.substring(51, 59));
  }

  public get disburseAmountStudent() {
    return this.convertToAmountString(this.line.substring(59, 66));
  }

  public get disburseAmountInstitution() {
    return this.convertToAmountString(this.line.substring(66, 73));
  }

  public get dateSignedInstitution() {
    return this.convertToDateRecord(this.line.substring(73, 81));
  }

  public get institutionCode() {
    return this.line.substring(81, 85);
  }

  public get disburseMethodStudent() {
    return this.line.substring(85, 86);
  }

  public get studyPeriodEndDate() {
    return this.convertToDateRecord(this.line.substring(86, 94));
  }

  public get grants() {
    const grants: DisbursementReceiptGrant[] = [];
    let grantIndex = 122;
    for (let i = 1; i <= this.GRANT_OCCURRENCE; i++) {
      const grantType = this.line.substring(grantIndex, grantIndex + 6).trim();
      grantIndex = grantIndex + 6;

      const grantAmountText = this.line.substring(grantIndex, grantIndex + 7);
      grantIndex = grantIndex + 7;

      const grantAmount = this.convertToAmountString(grantAmountText);

      if (grantType && grantAmount) {
        grants.push(new DisbursementReceiptGrant(grantType, grantAmount));
      }
    }
    return grants;
  }
}

export class DisbursementReceiptDownloadResponse {
  header: DisbursementReceiptHeader;
  records: DisbursementReceiptDetail[];
}

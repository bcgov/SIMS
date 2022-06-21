import { DisbursementReceiptRecord } from "./disbursement-receipt-file-record";

/**
 * Number of occurrences of the grant field.
 */
const GRANT_OCCURRENCE = 10;

/**
 * Length of a grant type field.
 */
const GRANT_TYPE_LENGTH = 6;

/**
 * Length of a grant amount field.
 */
const GRANT_AMOUNT_LENGTH = 7;

/**
 * Model to parse the grant field of disbursement file detail record.
 */
export class DisbursementReceiptGrant {
  constructor(
    public readonly grantType: string,
    public readonly grantAmount: string,
  ) {}
}

/**
 * Disbursement receipt detail record which has the receipt details for disbursements sent.
 * The document number which is present in each of the receipt detail record connects the
 * disbursement sent with the receipt received.
 */
export class DisbursementReceiptDetail extends DisbursementReceiptRecord {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  get studentSIN() {
    return this.line.substring(14, 23);
  }

  get fundingType() {
    return this.line.substring(23, 25);
  }

  get documentNumber() {
    return parseInt(this.line.substring(25, 37));
  }

  get totalEntitledDisbursedAmount() {
    return this.convertToAmountString(this.line.substring(37, 44));
  }

  get totalDisbursedAmount() {
    return this.convertToAmountString(this.line.substring(44, 51));
  }

  get disburseDate() {
    return this.convertToDateRecord(this.line.substring(51, 59));
  }

  get disburseAmountStudent() {
    return this.convertToAmountString(this.line.substring(59, 66));
  }

  get disburseAmountInstitution() {
    return this.convertToAmountString(this.line.substring(66, 73));
  }

  get dateSignedInstitution() {
    return this.convertToDateRecord(this.line.substring(73, 81));
  }

  get institutionCode() {
    return this.line.substring(81, 85);
  }

  get disburseMethodStudent() {
    return this.line.substring(85, 86);
  }

  get studyPeriodEndDate() {
    return this.convertToDateRecord(this.line.substring(86, 94));
  }

  get totalEntitledGrantAmount() {
    return this.convertToAmountString(this.line.substring(94, 101));
  }

  get totalDisbursedGrantAmount() {
    return this.convertToAmountString(this.line.substring(101, 108));
  }

  get totalDisbursedGrantAmountStudent() {
    return this.convertToAmountString(this.line.substring(108, 115));
  }

  get totalDisbursedGrantAmountInstitution() {
    return this.convertToAmountString(this.line.substring(115, 122));
  }

  get grants() {
    const grants: DisbursementReceiptGrant[] = [];
    let grantIndex = 122;
    for (let i = 1; i <= GRANT_OCCURRENCE; i++) {
      const grantType = this.line
        .substring(grantIndex, grantIndex + GRANT_TYPE_LENGTH)
        .trim();
      grantIndex += GRANT_TYPE_LENGTH;

      const grantAmountText = this.line.substring(
        grantIndex,
        grantIndex + GRANT_AMOUNT_LENGTH,
      );
      grantIndex += GRANT_AMOUNT_LENGTH;

      const grantAmount = this.convertToAmountString(grantAmountText);

      if (grantType && grantAmount) {
        grants.push(new DisbursementReceiptGrant(grantType, grantAmount));
      }
    }
    return grants;
  }

  /**
   * Validate the record detail data.
   * @returns validation error message if validation fails.
   */
  getInvalidDataMessage(): string | null {
    const errors: string[] = [];
    if (isNaN(+this.studentSIN)) {
      errors.push("invalid student SIN");
    }
    if (isNaN(this.documentNumber)) {
      errors.push("invalid document number");
    }
    return errors.join(", ");
  }
}

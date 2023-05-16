import { getDateOnlyFromFormat } from "@sims/utilities";
import { ECEResponseFileRecord } from "./ece-response-file-record";
import { DATE_FORMAT } from "../models/ece-integration.model";

/**
 * Disbursement receipt detail record which has the receipt details for disbursements sent.
 * The document number which is present in each of the receipt detail record connects the
 * disbursement sent with the receipt received.
 */
export class ECEResponseFileDetail extends ECEResponseFileRecord {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  get institutionCode(): string {
    return this.line.substring(1, 5);
  }

  /**
   * Unique index number for disbursement record.
   */
  get disbursementIdentifier(): number {
    const disbursementIdentifier = this.line.substring(5, 15);
    return +disbursementIdentifier;
  }

  get applicationNumber(): string {
    return this.line.substring(85, 95);
  }

  get isEnrolmentConfirmed(): boolean {
    return this.line.substring(134, 135) === "Y";
  }

  get enrolmentConfirmationDate(): Date {
    const enrolmentConfirmationDate = this.line.substring(135, 143);
    return getDateOnlyFromFormat(enrolmentConfirmationDate, DATE_FORMAT);
  }

  get payToSchoolAmount(): number {
    const schoolAmount = this.line.substring(144, 150);
    return +schoolAmount;
  }

  /**
   * Validate the record detail data.
   * @returns validation error message if validation fails.
   */
  getInvalidDataMessage(): string | undefined {
    const errors: string[] = [];
    if (isNaN(+this.payToSchoolAmount)) {
      errors.push("invalid Pay to school amount");
    }
    if (isNaN(this.disbursementIdentifier)) {
      errors.push("invalid unique index number for the disbursement record");
    }
    return errors.join(", ");
  }
}

import { getDateOnlyFromFormat } from "@sims/utilities";
import { ECEResponseFileRecord } from "./ece-response-file-record";
import { DATE_FORMAT } from "../models/ece-integration.model";

/**
 * ECE response file detail.
 * Read and parse the detail records of ECE response file.
 */
export class ECEResponseFileDetail extends ECEResponseFileRecord {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Unique code used to identify a post secondary institution.
   */
  get institutionCode(): string {
    return this.line.substring(1, 5);
  }

  /**
   * Unique index number for disbursement record.
   */
  get disbursementIdentifier(): number {
    return +this.line.substring(5, 15);
  }

  /**
   * Application number.
   */
  get applicationNumber(): string {
    return this.line.substring(85, 95);
  }

  /**
   * Indicates if the student is enrolled.
   */
  get isEnrolmentConfirmed(): boolean {
    return this.line.substring(134, 135) === "Y";
  }

  /**
   * Enrolment confirmation date.
   */
  get enrolmentConfirmationDate(): Date {
    const enrolmentConfirmationDate = this.line.substring(135, 143);
    return getDateOnlyFromFormat(enrolmentConfirmationDate, DATE_FORMAT);
  }

  /**
   * Indicates the amount to be paid from bank
   * to the educational institution.
   */
  get payToSchoolAmount(): number {
    const schoolAmount = this.line.substring(144, 148);
    const schoolAmountDecimal = this.line.substring(148, 150);
    return +`${schoolAmount}.${schoolAmountDecimal}`;
  }

  /**
   * Validate the record detail data.
   * @returns validation error message if validation fails.
   */
  getInvalidDataMessage(): string | undefined {
    const errors: string[] = [];
    if (isNaN(this.disbursementIdentifier)) {
      errors.push("invalid unique index number for the disbursement record.");
    }
    if (!this.applicationNumber) {
      errors.push("application number not found or invalid.");
    }
    return errors.length ? errors.join(", ") : undefined;
  }
}

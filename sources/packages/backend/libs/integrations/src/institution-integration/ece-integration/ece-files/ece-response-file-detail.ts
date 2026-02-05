import { getDateOnlyFromFormat } from "@sims/utilities";
import { ECEResponseFileRecord } from "./ece-response-file-record";
import {
  DATE_FORMAT,
  RecordTypeCodes,
  YNOptions,
} from "../models/ece-integration.model";

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
   * Unique index number for disbursement value record.
   */
  get disbursementValueId(): number {
    return +this.line.substring(5, 15);
  }

  /**
   * Disbursement value code.
   */
  get disbursementValueCode(): string {
    return this.line.substring(15, 19);
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
  get enrolmentConfirmationFlag(): YNOptions {
    return this.line.substring(134, 135) as YNOptions;
  }

  /**
   * Enrolment confirmation date.
   */
  get enrolmentConfirmationDate(): Date {
    const enrolmentConfirmationDate = this.line.substring(135, 143);
    return getDateOnlyFromFormat(enrolmentConfirmationDate, DATE_FORMAT, true);
  }

  /**
   * Indicates the amount to be paid from bank
   * to the educational institution.
   */
  get payToSchoolAmount(): number {
    return +this.line.substring(144, 148);
  }

  /**
   * Validate the record detail data.
   * @returns validation error message if validation fails.
   */
  getInvalidDataMessage(): string | undefined {
    const errors: string[] = [];
    if (this.recordType !== RecordTypeCodes.ECEDetail) {
      errors.push(`Invalid record type on detail: ${this.recordType}`);
    }
    if (isNaN(this.disbursementValueId)) {
      errors.push(
        "Invalid unique index number for the disbursement value ID record",
      );
    }
    if (
      !(
        this.disbursementValueCode === "INTP" ||
        this.disbursementValueCode === "INTF"
      ) &&
      (!this.applicationNumber?.trim() || Number.isNaN(+this.applicationNumber))
    ) {
      errors.push("Invalid application number");
    }
    return errors.length ? errors.join(", ") : undefined;
  }

  /**
   * Get warning messages for non-critical issues found in the record.
   * @returns warning message if any non-critical issue is found.
   */
  getWarningMessage(): string | undefined {
    if (
      this.disbursementValueCode === "INTP" ||
      this.disbursementValueCode === "INTF"
    ) {
      return `Disbursement schedule not found for disbursement value ID: ${this.disbursementValueId}, record at line ${this.lineNumber} skipped.`;
    }
    return undefined;
  }
}

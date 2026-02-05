import { getDateOnlyFromFormat } from "@sims/utilities";
import { ECEResponseFileRecord } from "./ece-response-file-record";
import {
  DATE_FORMAT,
  RecordTypeCodes,
  YNOptions,
} from "../models/ece-integration.model";

/**
 * Legacy award codes for which the records are skipped.
 * These awards are related to Interest free/in-study records from SFAS.
 */
const LEGACY_SKIPPED_AWARDS = new Set(["INTP", "INTF"]);

interface ValidationsResult {
  validationLevel: "warning" | "error";
  message: string;
}

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
  validate(): ValidationsResult[] {
    const validationsResult: ValidationsResult[] = [];
    const errors: string[] = [];
    if (this.recordType !== RecordTypeCodes.ECEDetail) {
      errors.push(`Invalid record type on detail: ${this.recordType}`);
    }
    if (Number.isNaN(this.disbursementValueId)) {
      errors.push(
        "Invalid unique index number for the disbursement value ID record",
      );
    }
    if (
      !LEGACY_SKIPPED_AWARDS.has(this.disbursementValueCode) &&
      (!this.applicationNumber?.trim() || Number.isNaN(+this.applicationNumber))
    ) {
      errors.push("Invalid application number");
    }
    if (errors.length) {
      validationsResult.push({
        validationLevel: "error",
        message: errors.join(", "),
      });
    }
    if (LEGACY_SKIPPED_AWARDS.has(this.disbursementValueCode)) {
      validationsResult.push({
        validationLevel: "warning",
        message: `Disbursement schedule not found for disbursement value ID: ${this.disbursementValueId}, record at line ${this.lineNumber} skipped.`,
      });
    }
    return validationsResult;
  }
}

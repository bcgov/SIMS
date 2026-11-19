import { ReturnedLoansResponseFileRecord } from "./returned-loans-response-file-record";

/**
 * Returned loan response file detail.
 */
export class ReturnedLoansResponseFileDetail extends ReturnedLoansResponseFileRecord {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line);
  }

  /**
   * Customer number - student SIN (Social Insurance Number).
   */
  get sin(): string {
    return this.line.substring(2, 11).trim();
  }

  /**
   * Validate the data to sanitize the record.
   * @returns validation errors if any, otherwise an empty array.
   */
  validate(): string[] {
    const errors: string[] = [];
    if (!this.sin) {
      errors.push("Invalid SIN");
    }
    return errors;
  }
}

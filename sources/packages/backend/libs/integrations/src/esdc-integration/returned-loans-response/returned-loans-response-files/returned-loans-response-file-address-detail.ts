import { ReturnedLoansResponseFileDetail } from "./returned-loans-response-file-detail";

/**
 * Returned loan response file address detail.
 */
export class ReturnedLoansResponseFileAddressDetail extends ReturnedLoansResponseFileDetail {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line, lineNumber);
  }

  /**
   * Customer(student) last name.
   */
  get lastName(): string {
    return this.line.substring(11, 41).trim();
  }

  /**
   * Customer(student) initial name.
   */
  get initialName(): string {
    return this.line.substring(41, 44).trim();
  }

  /**
   * Customer(student) first name.
   */
  get firstName(): string {
    return this.line.substring(44, 59).trim();
  }

  /**
   * Customer(student) birth date.
   */
  get dateOfBirth(): Date {
    return this.convertToDateRecord(this.line.substring(59, 67));
  }
}

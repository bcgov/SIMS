import { ReturnedLoansResponseFileDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-detail";

/**
 * Returned loan response file address detail.
 */
export class ReturnedLoansResponseFileAddressDetail extends ReturnedLoansResponseFileDetail {
  constructor(
    line: string,
    protected readonly _lineNumber: number,
  ) {
    super(line, _lineNumber);
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
   * Customer(student) birth date string.
   */
  private get dateOfBirthString(): string {
    return this.line.substring(59, 67);
  }

  /**
   * Customer(student) birth date.
   */
  get dateOfBirth(): Date {
    return this.convertToDateRecord(this.dateOfBirthString);
  }
}

import { ReturnedLoansResponseFileDetail } from "./returned-loans-response-file-detail";

/**
 * Returned loan response file address detail.
 * In all the comment blocks, "Customer" refers to the individual associated with the returned loan.
 */
export class ReturnedLoansResponseFileAddressDetail extends ReturnedLoansResponseFileDetail {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line, lineNumber);
  }

  /**
   * Customer last name.
   */
  get lastName(): string {
    return this.line.substring(11, 41).trim();
  }

  /**
   * Customer initial name.
   */
  get initialName(): string {
    return this.line.substring(41, 44).trim();
  }

  /**
   * Customer first name.
   */
  get firstName(): string {
    return this.line.substring(44, 59).trim();
  }

  /**
   * Customer birth date.
   */
  get dateOfBirth(): Date | null {
    return this.convertToDateRecord(this.line.substring(59, 67));
  }

  /**
   * Customer gender.
   */
  get gender(): string {
    return this.line.substring(67, 68).trim();
  }

  /**
   * Customer address line 1.
   */
  get addressLine1(): string {
    return this.line.substring(69, 99).trim();
  }

  /**
   * Customer address line 2.
   */
  get addressLine2(): string {
    return this.line.substring(99, 129).trim();
  }

  /**
   * Customer address city.
   */
  get city(): string {
    return this.line.substring(129, 159).trim();
  }

  /**
   * Customer address province code.
   */
  get provinceCode(): string {
    return this.line.substring(159, 161).trim();
  }

  /**
   * Customer address country code.
   */
  get country(): string {
    return this.line.substring(161, 189).trim();
  }

  /**
   * Customer address postal code.
   */
  get postalCode(): string {
    return this.line.substring(189, 199).trim();
  }

  /**
   * Customer home phone number.
   */
  get homePhone(): string {
    return this.line.substring(199, 209).trim();
  }

  /**
   * Customer other phone number(Business or overseas).
   */
  get otherPhone(): string {
    return this.line.substring(209, 229).trim();
  }

  /**
   * Date that the address information was last updated.
   */
  get addressEffectiveDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(229, 237));
  }

  /**
   * Validates the address detail fields.
   * @returns validation errors as an array of strings.
   */
  validate(): string[] {
    // Get validation errors from the parent class.
    const errors: string[] = super.validate();
    if (!this.lastName) {
      errors.push("Invalid last name");
    }
    if (!this.dateOfBirth) {
      errors.push("Invalid birth date");
    }
    if (!this.gender) {
      errors.push("Invalid gender");
    }
    return errors;
  }
}

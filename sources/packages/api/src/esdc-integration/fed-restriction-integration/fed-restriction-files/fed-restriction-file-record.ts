import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";

/**
 * Federal restriction record that contains the restriction code and restriction reason
 * associated with a Student.
 * Federal restrictions on the database contains only one code that is the result of the
 * combination of the 'restriction code' with the 'restriction reason code'(reason code is optional).
 * The documentation about it is available on the document
 * 'SLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class FedRestrictionFileRecord {
  constructor(
    private readonly line: string,
    public readonly lineNumber: number,
  ) {}

  public get sin(): string {
    return this.line.substr(0, 9);
  }

  public get surname(): string {
    return this.line.substr(9, 30).trim();
  }

  public get dateOfBirth(): Date {
    return getDateOnlyFromFormat(this.line.substr(69, 8), DATE_FORMAT);
  }

  public get restrictionCode(): string {
    return this.line.substr(84, 1);
  }

  public get restrictionReasonCode(): string {
    return this.line.substr(85, 1);
  }

  public getComposedCode() {
    return `${this.restrictionCode}${this.restrictionReasonCode}`.trim();
  }

  /**
   * Assess the record to know in advance if some invalid data is present.
   * @returns invalid data message, if any.
   */
  public getInvalidDataMessage(): string | null {
    const errors: string[] = [];
    if (isNaN(+this.sin)) {
      errors.push("invalid SIN number");
    }

    if (isNaN(this.dateOfBirth.getDate())) {
      errors.push("invalid date of birth");
    }

    if (!this.getComposedCode()) {
      errors.push("invalid restriction code");
    }
    return errors.join(", ");
  }
}

import { getDateOnlyFromFormat } from "src/utilities";
import { DATE_FORMAT } from "../fed-restriction-integration.models";

/**
 * Federal restriction record that contains the restriction code and restriction reason
 * associated with a Student.
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
    return this.line.substr(85, 1);
  }

  public get restrictionReasonCode(): string {
    return this.line.substr(86, 1);
  }
}

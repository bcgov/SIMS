import { CRAResponseRecordIdentification } from "./cra-response-record-identification";

/**
 * CRA Response Record (Trans Sub Code - 0101) that contains
 * information about the T4 earnings filed on CRA.
 */
export class CRAResponseT4EarningsRecord extends CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  public get T4EarningsValue(): number {
    return Number(this.line.substr(21, 9));
  }
}

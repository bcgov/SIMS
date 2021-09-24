import { CRAResponseRecordIdentification } from "./cra-response-record-identification";

/**
 * CRA Response Record (Trans Sub Code - 0101) that contains
 * information about the T4 earnings filed on CRA.
 * Please note that the numbers below (e.g. line.substr(21, 9))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAResponseT4EarningsRecord extends CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * T4 earnings returned from CRA for an income verification
   * for a particular tax year.
   * Named as T4-EARNINGS on CRA documentation.
   */
  public get T4EarningsValue(): number {
    return Number(this.line.substr(21, 9));
  }
}

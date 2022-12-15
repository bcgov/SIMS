import { CRAResponseRecordIdentification } from "./cra-response-record-identification";

/**
 * CRA Response Record (Trans Sub Code - 0150) that contains
 * information about the total income filed on CRA.
 * Please note that the numbers below (e.g. line.substr(21, 9))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAResponseTotalIncomeRecord extends CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Total income returned from CRA for an income verification
   * for a particular tax year (a.k.a. line 15000).
   * Named as TOTAL-INCOME on CRA documentation.
   */
  public get totalIncomeValue(): number {
    return Number(this.line.substr(21, 9));
  }
}

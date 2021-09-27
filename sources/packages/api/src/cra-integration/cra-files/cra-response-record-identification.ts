import {
  TransactionCodes,
  TransactionSubCodes,
} from "../cra-integration.models";

/**
 * Common identification info for a CRA response file record.
 * Please note that the numbers below (e.g. line.substr(0, 4)) represents
 * the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substr(0, 4) as TransactionCodes;
    this.sin = line.substr(4, 9);
    this.transactionSubCode = line.substr(17, 4) as TransactionSubCodes;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * Codes used to start all the lines of the files sent to CRA.
   */
  public readonly transactionCode: TransactionCodes;
  /**
   * SIN value that is part of the common record identification.
   */
  public readonly sin: string;
  /**
   * Secondary codes used alongside the records.
   */
  public readonly transactionSubCode: TransactionSubCodes;
  /**
   * Original line read from the CRA response file.
   */
  public readonly line: string;
  /**
   * Original line number where this record was present
   * in the CRA response file. Useful for log.
   */
  public readonly lineNumber: number;
}

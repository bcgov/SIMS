import {
  TransactionCodes,
  TransactionSubCodes,
} from "../models/msfaa-integration.model";

export class MSFAAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substr(0, 3) as TransactionCodes;
    this.msfaaNumber = line.substr(3, 10);
    this.sin = line.substr(13, 9);
    this.transactionSubCode = line.substr(22, 1) as TransactionSubCodes;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * Codes used to start all the lines of the files sent to MSFAA.
   */
  public readonly transactionCode: TransactionCodes;
  /**
   * MSFAA number of the record.
   */
  public readonly msfaaNumber: string;
  /**
   * SIN value that is part of the common record identification.
   */
  public readonly sin: string;
  /**
   * Secondary codes used alongside the records.
   */
  public readonly transactionSubCode: TransactionSubCodes;
  /**
   * Original line read from the MSFAA response file.
   */
  public readonly line: string;
  /**
   * Original line number where this record was present
   * in the MSFAA response file. Useful for log.
   */
  public readonly lineNumber: number;
}

import {
  RecordTypeCodes,
  ReceivedStatusCode,
} from "../models/msfaa-integration.model";

export class MSFAAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substr(0, 3) as RecordTypeCodes;
    this.msfaaNumber = line.substr(3, 10);
    this.sin = line.substr(13, 9);
    this.statusCode = line.substr(22, 1) as ReceivedStatusCode;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * Codes used to start all the lines of the files sent to MSFAA.
   */
  public readonly transactionCode: RecordTypeCodes;
  /**
   * MSFAA number of the record.
   */
  public readonly msfaaNumber: string;
  /**
   * SIN value that is part of the common record identification.
   */
  public readonly sin: string;
  /**
   * Status codes used alongside the records.
   */
  public readonly statusCode: ReceivedStatusCode;
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

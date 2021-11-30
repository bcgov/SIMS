import { RecordTypeCodes } from "../models/e-cert-full-time-integration.model";

export class ECertResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substr(0, 3) as RecordTypeCodes;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * transactionCode of the line.
   */
  public readonly transactionCode: RecordTypeCodes;
  /**
   * Original line read from the E-Cert response file.
   */
  public readonly line: string;
  /**
   * Original line number where this record was present
   * in the E-Cert response file. Useful for log.
   */
  public readonly lineNumber: number;
}

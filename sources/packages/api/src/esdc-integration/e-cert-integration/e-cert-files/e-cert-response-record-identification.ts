import { RecordTypeCodes } from "../models/e-cert-integration.model";

export class ECertResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * recordTypeCode of the line.
   */
  public readonly recordTypeCode: RecordTypeCodes;
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

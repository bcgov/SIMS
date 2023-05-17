import { RecordTypeCodes } from "../models/ece-integration.model";

/**
 * Base class for ECE response file record.
 * All the records of ECE response should extend this.
 */
export abstract class ECEResponseFileRecord {
  constructor(
    protected readonly line: string,
    protected readonly _lineNumber = 0,
  ) {}

  get lineNumber(): number {
    return this._lineNumber;
  }

  /**
   * Record type of the records in the file.
   */
  get recordType(): RecordTypeCodes {
    return this.line.substring(0, 1) as RecordTypeCodes;
  }
}

import { RecordTypeCodes } from "../sfas-integration.models";

/**
 * Identifies the type of the record from SFAS.
 */
export class SFASRecordIdentification {
  constructor(public readonly line: string, public readonly lineNumber = 0) {
    this.recordType = line.substr(0, 3) as RecordTypeCodes;
  }

  public readonly recordType: RecordTypeCodes;
}

import { RecordTypeCodes } from "../sfas-integration.models";

export class SFASRecordIdentification {
  constructor(public readonly line: string, public readonly lineNumber = 0) {
    this.recordType = parseInt(line.substr(0, 3)) as RecordTypeCodes;
  }

  public readonly recordType: RecordTypeCodes;
}

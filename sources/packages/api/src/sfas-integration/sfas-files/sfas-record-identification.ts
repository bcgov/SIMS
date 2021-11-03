import { RecordTypeCodes } from "../sfas-integration.models";

export class SFASRecordIdentification {
  constructor(
    protected readonly line: string,
    protected readonly lineNumber: number,
  ) {
    this.recordType = line.substr(0, 3) as RecordTypeCodes;
  }

  public readonly recordType: RecordTypeCodes;
}

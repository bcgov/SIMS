import { SFASRecordIdentification } from "../sfas-files/sfas-record-identification";

export abstract class SFASProcessBase {
  abstract execute(record: SFASRecordIdentification): Promise<void>;
}

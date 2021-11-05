import { SFASRecordIdentification } from "../sfas-files/sfas-record-identification";
import { SFASIndividualRecord } from "../sfas-files/sfas-individual-record";
import { SFASProcessBase } from "./sfas-process-base";
import { SFASIndividualService } from "../../services";

export class IndividualDataRecordProcess extends SFASProcessBase {
  constructor(private readonly sfasIndividualService: SFASIndividualService) {
    super();
  }

  async execute(record: SFASRecordIdentification): Promise<void> {
    const individualRecord = new SFASIndividualRecord(record.line);
    this.sfasIndividualService.saveIndividual(individualRecord);
  }
}

import { SFASRecordIdentification } from "../sfas-files/sfas-record-identification";
import { SFASStudentRecord } from "../sfas-files/sfas-student-record";
import { SFASProcessBase } from "./sfas-process-base";

export class IndividualDataRecordProcess extends SFASProcessBase {
  async execute(record: SFASRecordIdentification): Promise<void> {
    const studentRecord = new SFASStudentRecord(record.line);
    console.dir(studentRecord.firstName);
  }
}

import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  ProgramYear,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import * as faker from "faker";

export function createFakeDisbursementOveraward(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  studentAssessment?: StudentAssessment;
  disbursementSchedule?: DisbursementSchedule;
  addedBy?: User;
  addedDate?: Date;
}): DisbursementOveraward {
  const disbursementOveraward = new DisbursementOveraward();
  disbursementOveraward.student = relations?.student;
  disbursementOveraward.studentAssessment = relations?.studentAssessment;
  disbursementOveraward.disbursementSchedule = relations?.disbursementSchedule;
  disbursementOveraward.overawardValue = faker.random.number({
    min: 500,
    max: 50000,
  });
  disbursementOveraward.disbursementValueCode = faker.random
    .alpha({
      count: 4,
    })
    .toUpperCase();
  disbursementOveraward.originType =
    DisbursementOverawardOriginType.ManualRecord;
  disbursementOveraward.deletedAt = null;
  disbursementOveraward.addedBy = relations?.addedBy;
  disbursementOveraward.addedDate = relations?.addedDate;
  return disbursementOveraward;
}

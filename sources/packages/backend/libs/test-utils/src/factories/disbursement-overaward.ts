import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  ProgramYear,
  Student,
  StudentAssessment,
} from "@sims/sims-db";
import * as faker from "faker";

export function createFakeDisbursementOveraward(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  studentAssessment?: StudentAssessment;
  disbursementSchedule?: DisbursementSchedule;
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
  return disbursementOveraward;
}

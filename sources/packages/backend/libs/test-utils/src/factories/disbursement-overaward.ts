import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  ProgramYear,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";

export function createFakeDisbursementOveraward(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  studentAssessment?: StudentAssessment;
  disbursementSchedule?: DisbursementSchedule;
  addedBy?: User;
}): DisbursementOveraward {
  const disbursementOveraward = new DisbursementOveraward();
  disbursementOveraward.student = relations?.student;
  disbursementOveraward.studentAssessment = relations?.studentAssessment;
  disbursementOveraward.disbursementSchedule = relations?.disbursementSchedule;
  disbursementOveraward.overawardValue = faker.number.int({
    min: 500,
    max: 50000,
  });
  disbursementOveraward.disbursementValueCode = faker.string.alpha({
    length: 4,
    casing: "upper",
  });
  disbursementOveraward.originType =
    DisbursementOverawardOriginType.ManualRecord;
  disbursementOveraward.deletedAt = null;
  disbursementOveraward.addedBy = relations?.addedBy;
  disbursementOveraward.addedDate = null;
  return disbursementOveraward;
}

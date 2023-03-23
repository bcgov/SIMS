import {
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentAssessment,
  User,
} from "@sims/sims-db";

export function createFakeStudentAppealRequest(relations?: {
  studentAppeal?: StudentAppeal;
  assessedBy?: User;
  application?: Application;
  studentAssessment?: StudentAssessment;
}): StudentAppealRequest {
  const appealRequest = new StudentAppealRequest();
  appealRequest.studentAppeal = relations?.studentAppeal;
  appealRequest.submittedFormName = "SomeFormioFormName";
  appealRequest.appealStatus = StudentAppealStatus.Approved;
  appealRequest.submittedData = {};
  appealRequest.assessedDate = null;
  appealRequest.assessedBy = relations?.assessedBy;
  appealRequest.note = null;
  return appealRequest;
}

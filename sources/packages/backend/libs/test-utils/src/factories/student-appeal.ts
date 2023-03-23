import {
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAssessment,
} from "@sims/sims-db";

export function createFakeStudentAppeal(relations?: {
  application?: Application;
  studentAssessment?: StudentAssessment;
  appealRequests?: StudentAppealRequest[];
}): StudentAppeal {
  const studentAppeal = new StudentAppeal();
  studentAppeal.application = relations?.application;
  studentAppeal.submittedDate = new Date();
  studentAppeal.studentAssessment = relations?.studentAssessment;
  studentAppeal.appealRequests = relations?.appealRequests;
  return studentAppeal;
}

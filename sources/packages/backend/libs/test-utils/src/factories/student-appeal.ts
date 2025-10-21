import {
  Application,
  Student,
  StudentAppeal,
  StudentAppealRequest,
  StudentAssessment,
} from "@sims/sims-db";

/**
 * Creates a student appeal record ready to be saved to the database.
 * @param relations dependencies.
 * - `application` related student application.
 * - `student` related student. Student is mandatory if application is not provided.
 * If the application is provided and has a student linked, this parameter can be omitted.
 * - `studentAssessment` related assessment.
 * - `appealRequests` related appeal requests.
 * @returns a student appeal record ready to be saved to the database.
 */
export function createFakeStudentAppeal(relations?: {
  application?: Application;
  student?: Student;
  studentAssessment?: StudentAssessment;
  appealRequests?: StudentAppealRequest[];
}): StudentAppeal {
  const studentAppeal = new StudentAppeal();
  studentAppeal.application = relations?.application;
  studentAppeal.student = relations?.student ?? relations?.application?.student;
  studentAppeal.submittedDate = new Date();
  studentAppeal.studentAssessment = relations?.studentAssessment;
  studentAppeal.appealRequests = relations?.appealRequests;
  return studentAppeal;
}

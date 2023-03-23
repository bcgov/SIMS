import {
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAssessment,
} from "@sims/sims-db";

/**
 * Creates a student appeal record ready to be saved to the database.
 * @param relations dependencies.
 * - `application` related student application.
 * - `studentAssessment` related assessment.
 * - `appealRequests` related appeal requests.
 * @returns a student appeal record ready to be saved to the database.
 */
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

import {
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentAssessment,
  User,
} from "@sims/sims-db";

/**
 * Creates a student appeal request record ready to be saved to the database.
 * @param relations dependencies.
 * - `studentAppeal` related student appeal.
 * - `assessedBy` related Ministry user assessing the appeal request.
 * - `application` related student application.
 * - `studentAssessment` related assessment.
 * @returns a student appeal request record ready to be saved to the database.
 */
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

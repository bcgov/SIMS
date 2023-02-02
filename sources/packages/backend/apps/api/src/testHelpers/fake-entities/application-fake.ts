import {
  Application,
  ApplicationData,
  ApplicationStatus,
  ProgramYear,
  RelationshipStatus,
  Student,
  StudentAssessment,
} from "@sims/sims-db";
import { createFakeProgramYear } from "./program-year-fake";
import { createFakeStudent } from "./student-fake";
import { getUTCNow } from "@sims/utilities";

export function createFakeApplication(
  student?: Student,
  programYear?: ProgramYear,
  currentStudentAssessment?: StudentAssessment,
): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = programYear ?? createFakeProgramYear();
  application.student = student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = getUTCNow();
  application.applicationStatus = ApplicationStatus.Submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  application.currentAssessment = currentStudentAssessment;
  return application;
}

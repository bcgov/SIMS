import {
  Application,
  ApplicationData,
  ApplicationStatus,
  ProgramYear,
  RelationshipStatus,
  Student,
  StudentAssessment,
} from "@sims/sims-db";
import { createFakeProgramYear } from "./program-year";
import { createFakeStudent } from "./student";

export function createFakeApplication(
  student?: Student,
  programYear?: ProgramYear,
  currentStudentAssessment?: StudentAssessment,
): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = programYear ?? createFakeProgramYear();
  application.student = student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = new Date();
  application.applicationStatus = ApplicationStatus.submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  application.currentAssessment = currentStudentAssessment;
  return application;
}

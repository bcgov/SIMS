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

export function createFakeApplication(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  currentStudentAssessment?: StudentAssessment;
}): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = relations?.programYear ?? createFakeProgramYear();
  application.student = relations?.student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = new Date();
  application.applicationStatus = ApplicationStatus.Submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  application.currentAssessment = relations?.currentStudentAssessment;
  return application;
}

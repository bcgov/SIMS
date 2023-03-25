import {
  Application,
  ApplicationData,
  ApplicationException,
  ApplicationStatus,
  ProgramYear,
  RelationshipStatus,
  Student,
  StudentAssessment,
} from "@sims/sims-db";
import * as faker from "faker";
import { createFakeProgramYear } from "./program-year";
import { createFakeStudent } from "./student";

export function createFakeApplication(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  currentStudentAssessment?: StudentAssessment;
  applicationException?: ApplicationException;
}): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = relations?.programYear ?? createFakeProgramYear();
  // TODO get programYear from relations instead of setting the id here.
  application.programYear.id = 2;
  application.student = relations?.student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = new Date();
  application.applicationStatus = ApplicationStatus.Submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  application.currentAssessment = relations?.currentStudentAssessment;
  application.applicationNumber = faker.random.alphaNumeric(10);
  application.applicationException = relations?.applicationException;
  return application;
}

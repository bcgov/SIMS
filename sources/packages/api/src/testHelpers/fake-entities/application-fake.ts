import {
  Application,
  ApplicationData,
  ApplicationStatus,
  EducationProgramOffering,
  ProgramYear,
  RelationshipStatus,
  Student,
} from "../../database/entities";
import { createFakeProgramYear } from "./program-year-fake";
import { createFakeStudent } from "./student-fake";
import { getUTCNow } from "../../utilities/date-utils";

export function createFakeApplication(
  student?: Student,
  offering?: EducationProgramOffering,
  programYear?: ProgramYear,
): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = programYear ?? createFakeProgramYear();
  application.student = student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = getUTCNow();
  application.applicationStatus = ApplicationStatus.submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  return application;
}

import {
  Application,
  EducationProgramOffering,
  ProgramYear,
  Student,
} from "../../database/entities";
import { createFakeEducationProgramOffering } from "./education-program-offering-fake";
import { createFakeProgramYear } from "./program-year-fake";
import { createFakeStudent } from "./student-fake";

export function createFakeApplication(
  programYear: ProgramYear,
  student?: Student,
  offering?: EducationProgramOffering,
): Application {
  const application = new Application();
  application.data = {};
  application.programYear = programYear ?? createFakeProgramYear();
  application.student = student ?? createFakeStudent();
  application.offering = offering ?? createFakeEducationProgramOffering();
  return application;
}

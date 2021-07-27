import {
  Application,
  EducationProgramOffering,
  Student,
} from "../../database/entities";
import { createFakeEducationProgramOffering } from "./education-program-offering-fake";
import { createFakeStudent } from "./student-fake";

export function createFakeApplication(
  student?: Student,
  offering?: EducationProgramOffering,
): Application {
  const application = new Application();
  application.data = {};
  application.student = student ?? createFakeStudent();
  application.offering = offering ?? createFakeEducationProgramOffering();
  return application;
}

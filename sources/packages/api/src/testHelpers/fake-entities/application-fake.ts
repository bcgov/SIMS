import { Application, Student } from "../../database/entities";
import { createFakeStudent } from "./student-fake";

export function createFakeApplication(student?: Student): Application {
  const application = new Application();
  application.data = {};
  application.student = student ?? createFakeStudent();
  return application;
}

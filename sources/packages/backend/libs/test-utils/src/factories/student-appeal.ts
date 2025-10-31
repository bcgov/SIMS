import {
  Application,
  ProgramYear,
  Student,
  StudentAppeal,
  StudentAppealRequest,
  StudentAssessment,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";
import { saveFakeApplication } from "@sims/test-utils/factories/application";
import { createFakeStudentAppealRequest } from "@sims/test-utils/factories/student-appeal-request";

/**
 * Creates a student appeal record ready to be saved to the database.
 * @param relations dependencies.
 * - `application` related student application.
 * - `student` related student. Student is mandatory if application is not provided.
 * If the application is provided and has a student linked, this parameter can be omitted.
 * - `studentAssessment` related assessment.
 * - `appealRequests` related appeal requests.
 * @returns a student appeal record ready to be saved to the database.
 */
export function createFakeStudentAppeal(relations?: {
  application?: Application;
  student?: Student;
  studentAssessment?: StudentAssessment;
  appealRequests?: StudentAppealRequest[];
}): StudentAppeal {
  const studentAppeal = new StudentAppeal();
  studentAppeal.application = relations?.application;
  studentAppeal.student = relations?.student ?? relations?.application?.student;
  studentAppeal.submittedDate = new Date();
  studentAppeal.studentAssessment = relations?.studentAssessment;
  studentAppeal.appealRequests = relations?.appealRequests;
  return studentAppeal;
}

/**
 *  Saves a fake student appeal with the given appeal request inputs for the provided student.
 * @param student student.
 * @param appealRequestValues appeal request values.
 * @param options options.
 * - `isApplicationAppeal` indicates if the appeal is for an application.
 * - `programYear` application program year.
 * @returns the saved student appeal.
 */
export async function saveFakeAppealWithAppealRequests(
  db: E2EDataSources,
  student: Student,
  appealRequestValues: Partial<StudentAppealRequest>[],
  options?: { isApplicationAppeal?: boolean; programYear?: ProgramYear },
): Promise<StudentAppeal> {
  const appealRequests = appealRequestValues.map((appealRequestValue) =>
    createFakeStudentAppealRequest(undefined, {
      initialValues: appealRequestValue,
    }),
  );
  const studentAppeal = createFakeStudentAppeal({
    student,
    appealRequests,
  });
  if (options?.isApplicationAppeal) {
    studentAppeal.application = await saveFakeApplication(db.dataSource, {
      student,
      programYear: options?.programYear,
    });
  }
  return db.studentAppeal.save(studentAppeal);
}

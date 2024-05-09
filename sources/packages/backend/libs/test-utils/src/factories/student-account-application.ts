import { StudentAccountApplication, User } from "@sims/sims-db";

/**
 * Creates a fake student account application.
 * @param relations dependencies:
 * - `user` student that requested an account creation. It must be persisted already to database.
 * - `assessedBy` ministry user that approved or denied the student account application. It must be persisted already to database.
 * @param options options:
 * - `initialValues` values to be used instead of the default ones.
 * @returns a fake student account application ready to be persisted.
 */
export function createFakeStudentAccountApplication(
  relations: {
    user: User;
    assessedBy?: User;
  },
  options?: {
    initialValues?: Partial<StudentAccountApplication>;
  },
): StudentAccountApplication {
  const studentAccountApplication = new StudentAccountApplication();
  studentAccountApplication.submittedData =
    options?.initialValues?.submittedData ?? {};
  studentAccountApplication.submittedDate =
    options?.initialValues?.submittedDate ?? new Date();
  studentAccountApplication.user = relations.user;
  studentAccountApplication.assessedBy = relations.assessedBy;
  studentAccountApplication.assessedDate = options?.initialValues?.assessedDate;
  studentAccountApplication.deletedAt = options?.initialValues?.deletedAt;
  return studentAccountApplication;
}

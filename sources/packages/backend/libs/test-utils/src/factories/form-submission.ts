import {
  Application,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmission,
  FormSubmissionStatus,
  Student,
} from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { createFakeFormSubmissionItem } from "./form-submission-item";
import { saveFakeStudent } from "./student";

/**
 * Saves a fake form submission with one or more items to the database.
 * The submission cascades its items on save.
 * @param db e2e data sources.
 * @param relations submission relations.
 * - `student` student performing the submission. When not provided, a new student is created.
 * - `dynamicFormConfiguration` form configuration used by all items. When not provided,
 * an existing one is fetched from the database by the resolved `formCategory`.
 * - `application` application associated with the submission, used for appeal submissions
 * that are linked to a student application.
 * @param initialValues initial values for the form submission. When not provided, default values are used.
 * - `submissionStatus` submission status, defaults to `FormSubmissionStatus.Pending`.
 * @param options submission options.
 * - `formCategory` category for the submission and its dynamic form configuration.
 * Defaults to `FormCategory.StudentForm`.
 * - `submissionStatus` status of the submission. Defaults to `FormSubmissionStatus.Pending`.
 * - `numberOfItems` number of form items to create. Defaults to 1.
 * @returns the saved form submission, including cascaded items.
 */
export async function saveFakeFormSubmission(
  db: E2EDataSources,
  relations?: {
    student?: Student;
    dynamicFormConfiguration?: DynamicFormConfiguration;
    application?: Application;
  },
  initialValues?: Partial<FormSubmission>,
  options?: {
    numberOfItems?: number;
  },
): Promise<FormSubmission> {
  const formCategory = initialValues?.formCategory ?? FormCategory.StudentForm;
  const student = relations?.student ?? (await saveFakeStudent(db.dataSource));
  const dynamicFormConfiguration =
    relations?.dynamicFormConfiguration ??
    (await db.dynamicFormConfiguration.findOneOrFail({
      where: { formCategory },
    }));
  const submissionStatus =
    initialValues?.submissionStatus ?? FormSubmissionStatus.Pending;
  const formSubmission = new FormSubmission();
  formSubmission.student = student;
  formSubmission.creator = student.user;
  formSubmission.submittedDate = new Date();
  formSubmission.formCategory = formCategory;
  formSubmission.application = relations?.application;
  formSubmission.submissionStatus = submissionStatus;
  // The DB constraint requires assessedDate and assessedBy when not Pending.
  if (submissionStatus !== FormSubmissionStatus.Pending) {
    formSubmission.assessedDate = new Date();
    formSubmission.assessedBy = student.user;
  }
  const numberOfItems = options?.numberOfItems ?? 1;
  formSubmission.formSubmissionItems = Array.from(
    { length: numberOfItems },
    () => {
      const item = createFakeFormSubmissionItem({ dynamicFormConfiguration });
      item.creator = student.user;
      return item;
    },
  );

  return db.formSubmission.save(formSubmission);
}

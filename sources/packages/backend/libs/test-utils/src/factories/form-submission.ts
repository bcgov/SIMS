import {
  Application,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmission,
  FormSubmissionDecisionStatus,
  FormSubmissionItemDecision,
  FormSubmissionStatus,
  NoteType,
  Student,
  User,
} from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { createFakeFormSubmissionItem } from "./form-submission-item";
import { saveFakeStudent } from "./student";
import { createFakeNote } from "@sims/test-utils/factories/note";

/**
 * Test input data for creating form submission decisions.
 */
export interface FormSubmissionDecisionTestInputData {
  decisionStatus: FormSubmissionDecisionStatus;
}

/**
 * Test input data for creating form submission items,
 * including the decisions to be created for each item.
 */
export interface FormSubmissionItemTestInputData {
  /**
   * Dynamic form configuration to be associated with the form submission item.
   */
  dynamicFormConfiguration: DynamicFormConfiguration;
  /**
   * Decisions to be created for the form submission item.
   * If provided, the first decision will be considered the current decision for the item,
   * and the rest will be considered previous decisions.
   */
  decisions: FormSubmissionDecisionTestInputData[];
}

/**
 * Test data to create form submissions, its items and decisions.
 */
export interface FormSubmissionTestInputData {
  /**
   * Student to be associated with the form submission. When not provided,
   * the application students will be used or a new student is created.
   * The student user associated will be used as the creator.
   */
  student?: Student;
  /**
   * Application associated with the form submission.
   * If not provided, the form submission will not be associated with any application.
   * If provided with a student, the student user associated will be used as the creator.
   */
  application?: Application;
  /**
   * Form category for the form submission.
   */
  formCategory: FormCategory;
  /**
   * Form submission status. Defaults to `Pending` when not provided.
   * If some status other than `Pending` is provided, the assessedDate and assessedBy fields will
   * be automatically set with the current date and the Ministry audit user, respectively.
   */
  submissionStatus: FormSubmissionStatus;
  /**
   * Used to simulate the creation of the submissions in different points in time.
   */
  now?: Date;
  /**
   * Ministry user responsible for the decisions and notes data changes.
   * Required when the submission status is different than `Pending`.
   */
  ministryAuditUser?: User;
  /**
   * Form submission items to be created.
   * Can be provided with decisions to be created for each item.
   * If decisions are provided, the first one will be considered
   * the current decision for the item.
   */
  formSubmissionItems: FormSubmissionItemTestInputData[];
}

/**
 * Creates and saves a fake form submission with its items and decisions based on the provided test input data.
 * @param db E2E data sources.
 * @param testInputData test input data for creating the form submission and related data.
 * @returns the created form submission.
 */
export async function saveFakeFormSubmissionFromInputTestData(
  db: E2EDataSources,
  testInputData: FormSubmissionTestInputData,
): Promise<FormSubmission> {
  const now = testInputData.now ?? new Date();
  const student =
    testInputData.student ??
    testInputData.application?.student ??
    (await saveFakeStudent(db.dataSource));
  const formSubmission = new FormSubmission();
  formSubmission.student = student;
  formSubmission.application = testInputData.application;
  formSubmission.createdAt = now;
  formSubmission.creator = student.user;
  formSubmission.submittedDate = now;
  formSubmission.formCategory = testInputData.formCategory;
  formSubmission.submissionStatus = testInputData.submissionStatus;
  if (testInputData.submissionStatus !== FormSubmissionStatus.Pending) {
    formSubmission.assessedDate = now;
    formSubmission.assessedBy = testInputData.ministryAuditUser;
  }
  formSubmission.formSubmissionItems = [];
  await db.formSubmission.save(formSubmission);
  for (const itemInputData of testInputData.formSubmissionItems) {
    const submissionItem = createFakeFormSubmissionItem({
      dynamicFormConfiguration: itemInputData.dynamicFormConfiguration,
      creator: student.user,
    });
    submissionItem.formSubmission = formSubmission;
    // Update the array to avoid reloading the data and allowing a
    // method consumer to have access to the data.
    formSubmission.formSubmissionItems.push(submissionItem);
    // Save form submission item to generate the ID for the item, which is required for the decision relation.
    await db.formSubmissionItem.save(submissionItem);
    submissionItem.decisions = [];
    for (const decisionTestInputData of itemInputData.decisions) {
      const decision = new FormSubmissionItemDecision();
      decision.formSubmissionItem = submissionItem;
      decision.decisionStatus = decisionTestInputData.decisionStatus;
      decision.creator = testInputData.ministryAuditUser;
      decision.createdAt = now;
      decision.decisionBy = testInputData.ministryAuditUser;
      decision.decisionDate = now;
      decision.modifier = testInputData.ministryAuditUser;
      decision.updatedAt = now;
      // Note creation.
      const noteType =
        testInputData.formCategory === FormCategory.StudentAppeal
          ? NoteType.StudentAppeal
          : NoteType.StudentForm;
      const note = createFakeNote(noteType, {
        creator: testInputData.ministryAuditUser,
      });
      await db.note.save(note);
      decision.decisionNote = note;
      // Update the array to avoid reloading the data and allowing a
      // method consumer to have access to the data.
      submissionItem.decisions.push(decision);
    }
    await db.formSubmissionItemDecision.save(submissionItem.decisions);
  }
  // Associate the current decision for each item as the first decision in
  // the decisions array, if there are any decisions.
  for (const formSubmissionItem of formSubmission.formSubmissionItems) {
    if (formSubmissionItem.decisions.length > 0) {
      const [currentDecision] = formSubmissionItem.decisions;
      formSubmissionItem.currentDecision = currentDecision;
    }
  }
  // Save the form submission again to update the relation with the current decision.
  await db.formSubmission.save(formSubmission);
  return formSubmission;
}

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
 * @param options submission options.
 * - `initialValues` initial values for the form submission. When not provided, default values are used.
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
  options?: {
    initialValues?: Partial<FormSubmission>;
    numberOfItems?: number;
  },
): Promise<FormSubmission> {
  const formCategory =
    options?.initialValues?.formCategory ?? FormCategory.StudentForm;
  const student = relations?.student ?? (await saveFakeStudent(db.dataSource));
  const dynamicFormConfiguration =
    relations?.dynamicFormConfiguration ??
    (await db.dynamicFormConfiguration.findOneOrFail({
      where: { formCategory },
    }));
  const submissionStatus =
    options?.initialValues?.submissionStatus ?? FormSubmissionStatus.Pending;
  const formSubmission = new FormSubmission();
  formSubmission.student = student;
  formSubmission.creator = student.user;
  formSubmission.submittedDate =
    options?.initialValues?.submittedDate ?? new Date();
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
    () =>
      createFakeFormSubmissionItem({
        dynamicFormConfiguration,
        creator: student.user,
      }),
  );

  return db.formSubmission.save(formSubmission);
}

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

export interface FormSubmissionDecisionTestInputData {
  decisionStatus: FormSubmissionDecisionStatus;
}

export interface FormSubmissionItemTestInputData {
  dynamicFormConfiguration?: DynamicFormConfiguration;
  setFirstDecisionAsCurrent?: boolean;
  decisions: FormSubmissionDecisionTestInputData[];
}

export interface FormSubmissionTestInputData {
  student?: Student;
  application?: Application;
  formCategory: FormCategory;
  submissionStatus: FormSubmissionStatus;
  auditUser: User;
  formSubmissionItems: FormSubmissionItemTestInputData[];
}

export async function saveFakeFormSubmissionFromInputTestData(
  db: E2EDataSources,
  inputData: FormSubmissionTestInputData,
): Promise<FormSubmission> {
  const now = new Date();
  const student = inputData.student ?? inputData.application?.student ?? (await saveFakeStudent(db.dataSource));
  const formSubmission = new FormSubmission();
  formSubmission.student = student;
  formSubmission.creator = student.user;
  formSubmission.submittedDate = now;
  formSubmission.formCategory = inputData.formCategory;
  formSubmission.submissionStatus = inputData.submissionStatus;
  if (inputData.submissionStatus !== FormSubmissionStatus.Pending) {
    formSubmission.assessedDate = now;
    formSubmission.assessedBy = inputData.auditUser;
  }
  formSubmission.formSubmissionItems = [];
  for (const itemInputData of inputData.formSubmissionItems) {
    const submissionItem = createFakeFormSubmissionItem({
      dynamicFormConfiguration: itemInputData.dynamicFormConfiguration,
      auditUser: inputData.auditUser,
    });
    submissionItem.decisions = [];
    for (const decisionData of itemInputData.decisions) {
      const decision = new FormSubmissionItemDecision();
      decision.decisionStatus = decisionData.decisionStatus;
      decision.creator = inputData.auditUser;
      decision.createdAt = now;
      decision.decisionBy = inputData.auditUser;
      decision.decisionDate = now;
      decision.modifier = inputData.auditUser;
      decision.updatedAt = now;
      const note = createFakeNote();
      note.creator = inputData.auditUser;
      note.description = `Note for decision with status ${decisionData.decisionStatus}`;
      note.noteType = inputData.formCategory === FormCategory.StudentAppeal ? NoteType.StudentAppeal : NoteType.StudentForm;
      await db.note.save(note);
      decision.decisionNote = note;
      submissionItem.decisions.push(decision);
    }
    formSubmission.formSubmissionItems.push(submissionItem);
  }
  await db.formSubmission.save(formSubmission);
  for (let i = 0; i < formSubmission.formSubmissionItems.length; i++) {
    const itemTestInput = inputData.formSubmissionItems[i];
    const formSubmissionItem = formSubmission.formSubmissionItems[i];
    if (itemTestInput.setFirstDecisionAsCurrent) {
      formSubmissionItem.currentDecision = formSubmissionItem.decisions[0];
    }
  }
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
    () => {
      const item = createFakeFormSubmissionItem({ dynamicFormConfiguration });
      item.creator = student.user;
      return item;
    },
  );

  return db.formSubmission.save(formSubmission);
}

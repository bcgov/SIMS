import {
  DynamicFormConfiguration,
  FormCategory,
  FormSubmission,
  FormSubmissionDecisionStatus,
  FormSubmissionItem,
  FormSubmissionItemDecision,
  FormSubmissionStatus,
  NoteType,
  Student,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { createFakeNote } from "./note";
import { saveFakeStudent } from "./student";

/**
 * Creates a fake form submission item decision ready to be persisted via cascade.
 * @param relations decision relations.
 * - `decisionBy` user who made the decision.
 * @param options decision options.
 * - `decisionStatus` decision status. Defaults to `FormSubmissionDecisionStatus.Approved`.
 * @returns a form submission item decision not yet persisted.
 */
export function createFakeFormSubmissionItemDecision(
  relations: { decisionBy: User },
  options?: {
    decisionStatus?: FormSubmissionDecisionStatus;
  },
): FormSubmissionItemDecision {
  const decision = new FormSubmissionItemDecision();
  decision.decisionStatus =
    options?.decisionStatus ?? FormSubmissionDecisionStatus.Approved;
  decision.decisionDate = new Date();
  decision.decisionBy = relations.decisionBy;
  decision.decisionNote = createFakeNote(NoteType.Application, {
    creator: relations.decisionBy,
  });
  return decision;
}

/**
 * Creates a fake form submission item ready to be persisted via cascade from
 * a parent `FormSubmission`.
 * @param dynamicFormConfiguration dynamic form configuration for the item.
 * @param options item options.
 * - `currentDecision` current decision. When not provided the item will have no decision (Pending).
 * @returns a form submission item not yet persisted.
 */
export function createFakeFormSubmissionItem(
  dynamicFormConfiguration: DynamicFormConfiguration,
  options?: {
    currentDecision?: FormSubmissionItemDecision;
  },
): FormSubmissionItem {
  const item = new FormSubmissionItem();
  item.dynamicFormConfiguration = dynamicFormConfiguration;
  item.submittedData = { someField: faker.lorem.word() };
  item.currentDecision = options?.currentDecision;
  return item;
}

/**
 * Saves a fake form submission with one or more items to the database.
 * The submission cascades its items on save.
 * @param db e2e data sources.
 * @param relations submission relations.
 * - `student` student performing the submission. When not provided, a new student is created.
 * - `dynamicFormConfiguration` form configuration used by all items. When not provided,
 * an existing one is fetched from the database by the resolved `formCategory`.
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
  },
  options?: {
    formCategory?: FormCategory;
    submissionStatus?: FormSubmissionStatus;
    numberOfItems?: number;
  },
): Promise<FormSubmission> {
  const formCategory = options?.formCategory ?? FormCategory.StudentForm;
  const student = relations?.student ?? (await saveFakeStudent(db.dataSource));
  const dynamicFormConfiguration =
    relations?.dynamicFormConfiguration ??
    (await db.dynamicFormConfiguration.findOneOrFail({
      where: { formCategory },
    }));

  const formSubmission = new FormSubmission();
  formSubmission.student = student;
  formSubmission.creator = student.user;
  formSubmission.submittedDate = new Date();
  formSubmission.formCategory = formCategory;
  const submissionStatus =
    options?.submissionStatus ?? FormSubmissionStatus.Pending;
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
      const item = createFakeFormSubmissionItem(dynamicFormConfiguration);
      item.creator = student.user;
      return item;
    },
  );

  return db.formSubmission.save(formSubmission);
}

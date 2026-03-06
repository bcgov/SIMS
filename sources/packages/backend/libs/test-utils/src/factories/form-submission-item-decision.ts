import {
  FormSubmissionDecisionStatus,
  FormSubmissionItemDecision,
  NoteType,
  User,
} from "@sims/sims-db";
import { createFakeNote } from "./note";

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
  initialValues?: Partial<FormSubmissionItemDecision>,
): FormSubmissionItemDecision {
  const decision = new FormSubmissionItemDecision();
  decision.decisionStatus =
    initialValues?.decisionStatus ?? FormSubmissionDecisionStatus.Approved;
  decision.decisionDate = new Date();
  decision.decisionBy = relations.decisionBy;
  decision.decisionNote = createFakeNote(NoteType.StudentForm, {
    creator: relations.decisionBy,
  });
  return decision;
}

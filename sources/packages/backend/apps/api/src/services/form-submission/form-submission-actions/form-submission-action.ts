import { EntityManager } from "typeorm";
import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import {
  FormSubmissionActionModel,
  FormSubmissionItemActionModel,
} from "./form-submission-action-models";

/**
 * Actions that can be performed on form submissions during the Ministry approval/decline process.
 * Please note that a declined action can also trigger actions. It is the responsibility of each
 * action to determine if it should be executed based on the form submission data.
 */
export abstract class FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  abstract get actionType(): FormSubmissionActionType;

  /**
   * Process the form submission action.
   * @param formSubmission the form submission to process actions for.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   */
  async process(
    formSubmission: FormSubmissionActionModel,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    if (!this.appliesTo(formSubmission)) {
      return;
    }
    await this.applyAction(
      formSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );
  }

  /**
   * Execute the action for the given form submission.
   * @param formSubmission the form submission to process actions for.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   */
  protected abstract applyAction(
    formSubmission: FormSubmissionActionModel,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void>;

  /**
   * Determines if the action applies to the given form submission.
   * @param formSubmission the form submission to check.
   * @returns true if the action applies, false otherwise.
   */
  protected abstract appliesTo(
    formSubmission: FormSubmissionActionModel,
  ): boolean;

  /**
   * Filter only the submission items that are associated with this action.
   * @param formSubmission form submission and its requests.
   * @param options optional filters.
   * - `decisionStatus` filter the submission items by their current decision status.
   * @returns the submission items associated with this action.
   */
  protected getSubmissionItemsByActionType(
    formSubmission: FormSubmissionActionModel,
    options?: { decisionStatus?: FormSubmissionDecisionStatus },
  ): FormSubmissionItemActionModel[] {
    return formSubmission.submissionItems.filter(
      (request) =>
        request.actions.includes(this.actionType) &&
        (!options?.decisionStatus ||
          request.decisionStatus === options.decisionStatus),
    );
  }
}

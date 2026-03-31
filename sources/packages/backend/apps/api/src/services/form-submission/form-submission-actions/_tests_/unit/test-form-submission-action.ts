/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { FormSubmissionAction } from "../../form-submission-action";
import {
  FormSubmissionActionModel,
  FormSubmissionItemActionModel,
} from "../../form-submission-action-models";
import { EntityManager } from "typeorm";

/**
 * Concrete action used only for testing the protected methods.
 */
export class TestFormSubmissionAction extends FormSubmissionAction {
  constructor(private readonly testActionType: FormSubmissionActionType) {
    super();
  }

  get actionType(): FormSubmissionActionType {
    return this.testActionType;
  }

  protected applyAction(
    _formSubmission: FormSubmissionActionModel,
    _auditUserId: number,
    _auditDate: Date,
    _entityManager: EntityManager,
  ): Promise<void> {
    return Promise.resolve();
  }

  protected appliesTo(_formSubmission: FormSubmissionActionModel): boolean {
    return true;
  }

  exposedGetSubmissionItemsByActionType(
    formSubmission: FormSubmissionActionModel,
    options?: { decisionStatus?: FormSubmissionDecisionStatus },
  ): FormSubmissionItemActionModel[] {
    return this.getSubmissionItemsByActionType(formSubmission, options);
  }
}

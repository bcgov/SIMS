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
 * Concrete action used to support unit tests.
 */
export class TestFormSubmissionAction extends FormSubmissionAction {
  private readonly testActionType: FormSubmissionActionType;
  private readonly appliesToResult: boolean;

  constructor(options: {
    actionType: FormSubmissionActionType;
    appliesToResult?: boolean;
  }) {
    super();
    this.testActionType = options.actionType;
    this.appliesToResult = options.appliesToResult ?? true;
  }

  get actionType(): FormSubmissionActionType {
    return this.testActionType;
  }

  applyAction = jest.fn(
    (
      _formSubmission: FormSubmissionActionModel,
      _auditUserId: number,
      _auditDate: Date,
      _entityManager: EntityManager,
    ): Promise<void> => Promise.resolve(),
  );

  protected appliesTo(_formSubmission: FormSubmissionActionModel): boolean {
    return this.appliesToResult;
  }

  exposedGetSubmissionItemsByActionType(
    formSubmission: FormSubmissionActionModel,
    options?: { decisionStatus?: FormSubmissionDecisionStatus },
  ): FormSubmissionItemActionModel[] {
    return this.getSubmissionItemsByActionType(formSubmission, options);
  }
}

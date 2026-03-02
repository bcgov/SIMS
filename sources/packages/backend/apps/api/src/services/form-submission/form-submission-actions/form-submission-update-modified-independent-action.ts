import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  ModifiedIndependentStatus,
  Student,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateModifiedIndependentAction extends FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateModifiedIndependent;
  }

  /**
   * Updates the student's modified independent status based on the approval status.
   * @param formSubmission form submission to process.
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
    // The actions are only invoked if at least one submission item is associated with it.
    // The form submission framework also validates that only one item would be possible to
    // be submitted, hence it is safe to assume that there will be only one item associated
    // with this action.
    const [submissionItem] =
      this.getSubmissionItemsByActionType(formSubmission);
    const modifiedIndependentStatus =
      submissionItem.decisionStatus === FormSubmissionDecisionStatus.Approved
        ? ModifiedIndependentStatus.Approved
        : ModifiedIndependentStatus.Declined;
    const auditUser = { id: auditUserId };
    await entityManager.getRepository(Student).update(
      { id: formSubmission.studentId },
      {
        modifiedIndependentStatus,
        modifiedIndependentFormSubmissionItem: { id: submissionItem.id },
        modifiedIndependentStatusUpdatedBy: auditUser,
        modifiedIndependentStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
  }
}

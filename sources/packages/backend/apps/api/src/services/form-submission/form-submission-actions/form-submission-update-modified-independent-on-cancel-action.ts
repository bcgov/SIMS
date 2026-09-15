import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  ModifiedIndependentStatus,
  Student,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateModifiedIndependentOnCancelAction extends FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateModifiedIndependentOnCancel;
  }

  /**
   * Updates the student's modified independent status to Not Requested if the form submission
   * is cancelled and the student's modified independent status is currently Requested.
   * @param formSubmission form submission to process.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   */
  protected async applyAction(
    formSubmission: FormSubmissionActionModel,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    const submissionItems = this.getSubmissionItemsByActionType(formSubmission);
    if (submissionItems.length !== 1) {
      throw new Error(
        `Unexpected number of submission items associated with the form submission action. Expected 1 but found ${submissionItems.length}.`,
      );
    }
    const auditUser = { id: auditUserId };
    await entityManager.getRepository(Student).update(
      {
        id: formSubmission.studentId,
        modifiedIndependentStatus: ModifiedIndependentStatus.Requested,
      },
      {
        modifiedIndependentStatus: ModifiedIndependentStatus.NotRequested,
        modifiedIndependentStatusUpdatedBy: auditUser,
        modifiedIndependentStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
  }

  /**
   * Determines if the action applies to the given form submission.
   * @param formSubmission the form submission to check.
   * @returns true if the action applies, false otherwise.
   */
  protected appliesTo(formSubmission: FormSubmissionActionModel): boolean {
    return (
      formSubmission.submissionStatus === FormSubmissionStatus.Cancelled &&
      formSubmission.formCategory === FormCategory.StudentAppeal
    );
  }
}

import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  ModifiedIndependentStatus,
  Student,
} from "@sims/sims-db";
import { EntityManager, In } from "typeorm";
import { LoggerService } from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateModifiedIndependentOnSubmissionAction extends FormSubmissionAction {
  constructor(private readonly logger: LoggerService) {
    super();
  }
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateModifiedIndependentOnSubmission;
  }

  /**
  * Updates the student's modified independent status to Requested if the form submission
  * is submitted and the student's modified independent status is currently Not Requested or Declined.
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
    const updateResult = await entityManager.getRepository(Student).update(
      {
        id: formSubmission.studentId,
        modifiedIndependentStatus: In([
          ModifiedIndependentStatus.NotRequested,
          ModifiedIndependentStatus.Declined,
        ]),
      },
      {
        modifiedIndependentStatus: ModifiedIndependentStatus.Requested,
        modifiedIndependentStatusUpdatedBy: auditUser,
        modifiedIndependentStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
    if (updateResult.affected === 1) {
      this.logger.log(
        `Modified independent status updated to ${ModifiedIndependentStatus.Requested} for the student ID ${formSubmission.studentId} on submission.`,
      );
      return;
    }
    this.logger.log(
      `Modified independent status not updated for the student ID ${formSubmission.studentId} on submission.`,
    );
  }

  /**
   * Determines if the action applies to the given form submission.
   * @param formSubmission the form submission to check.
   * @returns true if the action applies, false otherwise.
   */
  protected appliesTo(formSubmission: FormSubmissionActionModel): boolean {
    return (
      formSubmission.submissionStatus === FormSubmissionStatus.Pending &&
      formSubmission.formCategory === FormCategory.StudentAppeal
    );
  }
}

import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  StudentScholasticStanding,
} from "@sims/sims-db";
import { EntityManager, IsNull } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateNonPunitiveScholasticStandingWithdrawalAction extends FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateNonPunitiveScholasticStandingWithdrawal;
  }

  /**
   * Updates the student's non-punitive scholastic standing withdrawal when the form submission is approved.
   * @param formSubmission form submission to process.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   * @throws Error If there is an unexpected number of submission items associated with the form submission action.
   * @throws Error If the form submission item associated with the non-punitive scholastic standing withdrawal is not approved.
   * @throws Error If the update operation fails.
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
    const [submissionItem] = submissionItems;
    if (
      submissionItem.decisionStatus !== FormSubmissionDecisionStatus.Approved
    ) {
      return;
    }
    // Update the student's non-punitive scholastic standing withdrawal with the scholastic standing id associated with the form submission item.
    const auditUser = { id: auditUserId };
    const submittedData = submissionItem.submittedData as {
      nonPunitiveWithdrawalId: number;
    };
    const updatedResult = await entityManager
      .getRepository(StudentScholasticStanding)
      .update(
        {
          id: submittedData.nonPunitiveWithdrawalId,
          nonPunitiveFormSubmissionItem: IsNull(),
          reversalDate: IsNull(),
        },
        {
          nonPunitiveFormSubmissionItem: { id: submissionItem.id },
          modifier: auditUser,
          updatedAt: auditDate,
        },
      );
    if (updatedResult.affected !== 1) {
      throw new Error(
        `Failed to update the non-punitive scholastic standing withdrawal with ID ${submittedData.nonPunitiveWithdrawalId}.`,
      );
    }
  }

  /**
   * Determines if the action applies to the given form submission.
   * @returns true if the action applies, false otherwise.
   */
  protected appliesTo(formSubmission: FormSubmissionActionModel): boolean {
    return formSubmission.formCategory === FormCategory.StudentForm;
  }
}

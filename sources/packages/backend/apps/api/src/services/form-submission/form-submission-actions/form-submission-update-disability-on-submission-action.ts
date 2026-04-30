import {
  DisabilityStatus,
  FormCategory,
  FormSubmissionActionType,
  Student,
} from "@sims/sims-db";
import { EntityManager, In, Not } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateDisabilityOnSubmissionAction extends FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateDisabilityOnSubmission;
  }

  /**
   * Update the student's disability status to "Requested" if the student's current disability status is not "PD" or "PPD".
   * @param formSubmission the form submission to process actions for.
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
        disabilityStatus: Not(In([DisabilityStatus.PD, DisabilityStatus.PPD])),
      },
      {
        disabilityStatus: DisabilityStatus.Requested,
        disabilityStatusUpdatedBy: auditUser,
        disabilityStatusUpdatedOn: auditDate,
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
      this.isPendingFinalDecisionStatus(formSubmission) &&
      formSubmission.formCategory === FormCategory.StudentForm
    );
  }
}

import {
  Application,
  AssessmentTriggerType,
  StudentAssessment,
  FormSubmissionActionType,
  FormCategory,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionCreateAppealAssessmentAction extends FormSubmissionAction {
  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.CreateStudentAppealAssessment;
  }

  /**
   * Create a new assessment for the form submission item.
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
    const approvedSubmissionItems = this.getSubmissionItemsByActionType(
      formSubmission,
      { decisionStatus: FormSubmissionDecisionStatus.Approved },
    );
    if (!approvedSubmissionItems.length) {
      // Skip this action since at least one of the submission items needs to be approved
      // for an assessment to be created.
      return;
    }
    // Create the new assessment to be processed.
    const auditUser = { id: auditUserId };
    const newAssessment = {
      application: { id: formSubmission.applicationId } as Application,
      offering: {
        id: formSubmission.currentOfferingId,
      },
      triggerType: AssessmentTriggerType.StudentAppeal,
      formSubmission: { id: formSubmission.id },
      creator: auditUser,
      createdAt: auditDate,
      submittedBy: auditUser,
      submittedDate: auditDate,
    } as StudentAssessment;
    await entityManager.getRepository(StudentAssessment).insert(newAssessment);
    await entityManager.getRepository(Application).update(
      { id: formSubmission.applicationId },
      {
        currentAssessment: { id: newAssessment.id },
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
      formSubmission.formCategory === FormCategory.StudentAppeal &&
      formSubmission.applicationId !== undefined
    );
  }
}

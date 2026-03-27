import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { FormSubmission, FormSubmissionActionType } from "@sims/sims-db";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionCreateAppealAssessmentAction } from "./form-submission-create-appeal-assessment-action";
import { FormSubmissionUpdateModifiedIndependentAction } from "./form-submission-update-modified-independent-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";
import { FormSubmissionUpdateNonPunitiveScholasticStandingWithdrawalAction } from "./form-submission-update-non-punitive-scholastic-standing-withdrawal-action";

/**
 * Keeps a list of all available form submission actions that can potentially
 * be processed and execute them based on the form submission action types.
 */
@Injectable()
export class FormSubmissionActionProcessor {
  private readonly actions: FormSubmissionAction[];

  constructor(
    createAppealAssessmentAction: FormSubmissionCreateAppealAssessmentAction,
    updateModifiedIndependentAction: FormSubmissionUpdateModifiedIndependentAction,
    updateNonPunitiveScholasticStandingWithdrawalAction: FormSubmissionUpdateNonPunitiveScholasticStandingWithdrawalAction,
  ) {
    this.actions = [
      createAppealAssessmentAction,
      updateModifiedIndependentAction,
      updateNonPunitiveScholasticStandingWithdrawalAction,
    ];
  }

  /**
   * Process the actions associated with a form submission.
   * Checks for the form submission requests action types and process
   * the corresponding actions as required.
   * Please note that a declined action can also trigger actions. It is the responsibility of each
   * action to determine if it should be executed based on the form submission data.
   * @param formSubmissionId the ID of the form submission to process actions for.
   * @param auditUserId the ID of the user performing the action.
   * @param auditDate the date the action is being performed.
   * @param entityManager entity manager to allow the query to happen within a transaction.
   */
  async processActions(
    formSubmissionId: number,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    const formSubmission = await this.getFormSubmissionForActionsProcessing(
      formSubmissionId,
      entityManager,
    );
    if (!formSubmission) {
      throw new Error(
        `Form submission with ID ${formSubmissionId} not found for actions processing.`,
      );
    }
    const actionTypes = formSubmission.submissionItems.flatMap(
      (request) => request.actions ?? [],
    );
    if (!actionTypes.length) {
      // No actions to process.
      return;
    }
    // Get unique action types to avoid processing the same action multiple times.
    const uniqueActionsTypes: Set<FormSubmissionActionType> = new Set(
      actionTypes,
    );
    // Ensure every action type is known.
    const unknownActions = [...uniqueActionsTypes].filter((requestActionType) =>
      this.actions.every((action) => action.actionType !== requestActionType),
    );
    if (unknownActions.length) {
      throw new Error(
        `One or more action types associated with the form submission ID ${formSubmissionId} are not recognized: ${unknownActions}.`,
      );
    }
    const actionsToProcess = this.actions.filter((action) =>
      uniqueActionsTypes.has(action.actionType),
    );
    // Process all actions in parallel.
    const actionsPromises = actionsToProcess.map((action) =>
      action.process(formSubmission, auditUserId, auditDate, entityManager),
    );
    await Promise.all(actionsPromises);
  }

  /**
   * Get the form submission details required for actions processing.
   * @param formSubmissionId ID of the form submission to retrieve.
   * @param entityManager entity manager to allow the query to happen
   * within a transaction.
   * @returns Form submission details required for actions processing
   * or null if not found.
   */
  private async getFormSubmissionForActionsProcessing(
    formSubmissionId: number,
    entityManager: EntityManager,
  ): Promise<FormSubmissionActionModel | null> {
    const formSubmission = await entityManager
      .getRepository(FormSubmission)
      .findOne({
        select: {
          id: true,
          formCategory: true,
          student: { id: true },
          application: {
            id: true,
            currentAssessment: {
              id: true,
              offering: { id: true },
            },
          },
          submissionStatus: true,
          formSubmissionItems: {
            id: true,
            submittedData: true,
            currentDecision: { decisionStatus: true },
          },
        },
        relations: {
          student: true,
          application: { currentAssessment: { offering: true } },
          formSubmissionItems: { currentDecision: true },
        },
        where: { id: formSubmissionId },
      });
    if (!formSubmission) {
      return null;
    }
    return {
      id: formSubmission.id,
      studentId: formSubmission.student.id,
      formCategory: formSubmission.formCategory,
      applicationId: formSubmission.application?.id,
      currentOfferingId:
        formSubmission.application?.currentAssessment?.offering?.id,
      submissionStatus: formSubmission.submissionStatus,
      submissionItems: formSubmission.formSubmissionItems.map((item) => ({
        id: item.id,
        actions: item.submittedData.actions ?? [],
        decisionStatus: item.currentDecision.decisionStatus,
        submittedData: item.submittedData,
      })),
    };
  }
}

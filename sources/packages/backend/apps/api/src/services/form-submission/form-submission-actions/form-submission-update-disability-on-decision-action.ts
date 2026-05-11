import {
  DisabilityStatus,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  Student,
} from "@sims/sims-db";
import { EntityManager, In, Not } from "typeorm";
import { Injectable } from "@nestjs/common";
import { LoggerService } from "@sims/utilities/logger";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

const APPROVED_DISABILITY_STATUSES = [
  DisabilityStatus.PD,
  DisabilityStatus.PPD,
];

const APPROVED_OR_DECLINED_DISABILITY_STATUSES = [
  ...APPROVED_DISABILITY_STATUSES,
  DisabilityStatus.Declined,
];

@Injectable()
export class FormSubmissionUpdateDisabilityOnDecisionAction extends FormSubmissionAction {
  constructor(private readonly logger: LoggerService) {
    super();
  }
  /**
   * Disability update action lookup.
   */
  private readonly disabilityUpdateActionLookup = [
    {
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      requestedDisabilityStatus: DisabilityStatus.PD,
      updateCriteria: {
        disabilityStatus: Not(In([DisabilityStatus.PD])),
      },
    },
    {
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_DISABILITY_STATUSES)),
      },
    },
    {
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      requestedDisabilityStatus: DisabilityStatus.PD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_OR_DECLINED_DISABILITY_STATUSES)),
      },
    },
    {
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_OR_DECLINED_DISABILITY_STATUSES)),
      },
    },
  ];

  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateDisabilityOnDecision;
  }

  /**
   * Update the student's disability status when the form submission final decision is made.
   * If the final decision is "Completed", then update the student disability status to "PD | PPD" if applicable.
   * If the final decision is "Declined", then update the student disability status to "Declined" if applicable.
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
    const [submissionItem] = submissionItems;
    const auditUser = { id: auditUserId };
    const submittedData = submissionItem.submittedData as {
      requestedDisabilityStatus: DisabilityStatus;
    };

    const updateActionLookup = this.disabilityUpdateActionLookup.find(
      (lookup) =>
        lookup.decisionStatus === submissionItem.decisionStatus &&
        lookup.requestedDisabilityStatus ===
          submittedData.requestedDisabilityStatus,
    );
    if (!updateActionLookup) {
      throw new Error(
        `Update action lookup not found for decision status ${submissionItem.decisionStatus} and disability status ${submittedData.requestedDisabilityStatus}.`,
      );
    }
    //
    const effectiveDisabilityStatus =
      submissionItem.decisionStatus === FormSubmissionDecisionStatus.Approved
        ? submittedData.requestedDisabilityStatus
        : DisabilityStatus.Declined;
    const updateResult = await entityManager.getRepository(Student).update(
      {
        id: formSubmission.studentId,
        ...updateActionLookup.updateCriteria,
      },
      {
        disabilityStatus: effectiveDisabilityStatus,
        disabilityStatusFormSubmissionItem: { id: submissionItem.id },
        disabilityStatusUpdatedBy: auditUser,
        disabilityStatusUpdatedOn: auditDate,
        disabilityStatusEffectiveDate: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
    if (updateResult.affected === 1) {
      this.logger.log(
        `Disability status updated to ${effectiveDisabilityStatus} for the student ID ${formSubmission.studentId} on decision.`,
      );
      return;
    }
    this.logger.log(
      `Disability status not updated for the student ID ${formSubmission.studentId} on decision.`,
    );
  }

  /**
   * Determines if the action applies to the given form submission.
   * @param formSubmission the form submission to check.
   * @returns true if the action applies, false otherwise.
   */
  protected appliesTo(formSubmission: FormSubmissionActionModel): boolean {
    return (
      this.hasFinalDecisionStatus(formSubmission) &&
      formSubmission.formCategory === FormCategory.StudentForm
    );
  }
}

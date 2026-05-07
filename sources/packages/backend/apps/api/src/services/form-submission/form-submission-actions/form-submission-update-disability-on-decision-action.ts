import {
  DisabilityStatus,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
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

@Injectable()
export class FormSubmissionUpdateDisabilityOnDecisionAction extends FormSubmissionAction {
  constructor(private readonly logger: LoggerService) {
    super();
  }
  /**
   * Disability update criteria lookup.
   */
  private readonly disabilityUpdateCriteriaLookup = [
    {
      formSubmissionStatus: FormSubmissionStatus.Completed,
      disabilityStatus: DisabilityStatus.PD,
      updateCriteria: {
        disabilityStatus: Not(In([DisabilityStatus.PD])),
      },
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Completed,
      disabilityStatus: DisabilityStatus.PPD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_DISABILITY_STATUSES)),
      },
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Declined,
      disabilityStatus: DisabilityStatus.PD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_DISABILITY_STATUSES)),
      },
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Declined,
      disabilityStatus: DisabilityStatus.PPD,
      updateCriteria: {
        disabilityStatus: Not(In(APPROVED_DISABILITY_STATUSES)),
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
      disabilityStatus: DisabilityStatus;
    };

    const updateCriteriaLookup = this.disabilityUpdateCriteriaLookup.find(
      (lookup) =>
        lookup.formSubmissionStatus === formSubmission.submissionStatus &&
        lookup.disabilityStatus === submittedData.disabilityStatus,
    );
    if (!updateCriteriaLookup) {
      throw new Error(
        `Update criteria not found for form submission status ${formSubmission.submissionStatus} and disability status ${submittedData.disabilityStatus}.`,
      );
    }
    const updateResult = await entityManager.getRepository(Student).update(
      {
        id: formSubmission.studentId,
        ...updateCriteriaLookup.updateCriteria,
      },
      {
        disabilityStatus: submittedData.disabilityStatus,
        disabilityStatusUpdatedBy: auditUser,
        disabilityStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
    if (updateResult.affected === 1) {
      this.logger.log(
        `Disability status updated to ${submittedData.disabilityStatus} for the student ID ${formSubmission.studentId} on decision.`,
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

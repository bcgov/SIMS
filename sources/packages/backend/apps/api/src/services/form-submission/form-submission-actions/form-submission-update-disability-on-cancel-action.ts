import { Injectable } from "@nestjs/common";
import {
  DisabilityStatus,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  Student,
} from "@sims/sims-db";
import { LoggerService } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { FormSubmissionAction } from "./form-submission-action";
import { FormSubmissionActionModel } from "./form-submission-action-models";

@Injectable()
export class FormSubmissionUpdateDisabilityOnCancelAction extends FormSubmissionAction {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  /**
   * Type of action being performed.
   */
  get actionType(): FormSubmissionActionType {
    return FormSubmissionActionType.UpdateDisabilityOnCancel;
  }

  /**
   * Update the student's disability status to "Not Requested" if the student's current disability status is "Requested".
   * @param formSubmission The form submission to process actions for.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate Date the action is being performed.
   * @param entityManager Entity manager to use for database operations.
   */
  protected async applyAction(
    formSubmission: FormSubmissionActionModel,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = { id: auditUserId };
    const updateResult = await entityManager.getRepository(Student).update(
      {
        id: formSubmission.studentId,
        disabilityStatus: DisabilityStatus.Requested,
      },
      {
        disabilityStatus: DisabilityStatus.NotRequested,
        disabilityStatusUpdatedBy: auditUser,
        disabilityStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
    if (updateResult.affected === 1) {
      this.logger.log(
        `Disability status updated to ${DisabilityStatus.NotRequested} for the student ID ${formSubmission.studentId} on cancellation.`,
      );
      return;
    }
    this.logger.log(
      `Disability status not updated for the student ID ${formSubmission.studentId} on cancellation.`,
    );
  }

  /**
   * Determines if the action applies to the given form submission.
   * @param formSubmission The form submission to check.
   * @returns True if the action applies, false otherwise.
   */
  protected appliesTo(formSubmission: FormSubmissionActionModel): boolean {
    return (
      formSubmission.submissionStatus === FormSubmissionStatus.Cancelled &&
      formSubmission.formCategory === FormCategory.StudentForm
    );
  }
}

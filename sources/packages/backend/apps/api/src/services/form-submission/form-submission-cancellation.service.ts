import { Injectable } from "@nestjs/common";
import {
  FORM_SUBMISSION_CANCELLED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_NOT_PENDING,
  FORM_SUBMISSION_WITH_MINISTRY_DECISION,
  FormSubmissionService,
} from "..";
import { DataSource, EntityManager } from "typeorm";
import { FormSubmission, FormSubmissionStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";

@Injectable()
export class FormSubmissionCancellationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly formSubmissionService: FormSubmissionService,
  ) {}

  /**
   * Validate form submission cancellation conditions.
   * @param submissionId form submission ID to validate.
   * @param entityManager entity manager to execute in transaction.
   * @param options options to validate the form submission cancellation.
   * - `studentId` ID of the student associated with the form submission.
   */
  async validate(
    submissionId: number,
    entityManager: EntityManager,
    options?: { studentId?: number },
  ): Promise<void> {
    // Acquire a DB lock for the form submission to prevent concurrent updates.
    await this.formSubmissionService.acquireLockOnFormSubmission(
      entityManager,
      {
        submissionId,
      },
    );
    const formSubmission = await entityManager
      .getRepository(FormSubmission)
      .findOne({
        select: {
          id: true,
          submissionStatus: true,
          formSubmissionItems: { id: true, currentDecision: { id: true } },
        },
        relations: {
          formSubmissionItems: {
            currentDecision: true,
          },
        },
        where: { id: submissionId, student: { id: options?.studentId } },
      });

    if (!formSubmission) {
      throw new CustomNamedError(
        `Form submission with ID ${submissionId} not found.`,
        FORM_SUBMISSION_NOT_FOUND,
      );
    }
    if (formSubmission.submissionStatus === FormSubmissionStatus.Cancelled) {
      throw new CustomNamedError(
        `Form submission with ID ${submissionId} is already cancelled.`,
        FORM_SUBMISSION_CANCELLED,
      );
    }
    if (formSubmission.submissionStatus !== FormSubmissionStatus.Pending) {
      throw new CustomNamedError(
        `Form submission with ID ${submissionId} is not in pending status and cannot be cancelled.`,
        FORM_SUBMISSION_NOT_PENDING,
      );
    }
    const hasAnySubmissionItemWithDecision =
      formSubmission.formSubmissionItems.some(
        (item) => !!item.currentDecision?.id,
      );
    if (hasAnySubmissionItemWithDecision) {
      throw new CustomNamedError(
        `Form submission with ID ${submissionId} has one or more form submission items with ministry decisions and cannot be cancelled.`,
        FORM_SUBMISSION_WITH_MINISTRY_DECISION,
      );
    }
  }

  /**
   * Cancel a form submission.
   * @param submissionId The ID of the form submission to cancel.
   * @param auditUserId The ID of the user performing the cancellation.
   * @param options options to validate the form submission cancellation.
   * - `studentId` ID of the student associated with the form submission.
   */
  async cancelFormSubmission(
    submissionId: number,
    auditUserId: number,
    options?: { studentId?: number },
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      await this.validate(submissionId, entityManager, options);
      const now = new Date();
      const auditUser = { id: auditUserId };
      await entityManager.getRepository(FormSubmission).update(
        { id: submissionId },
        {
          submissionStatus: FormSubmissionStatus.Cancelled,
          submissionStatusUpdatedOn: now,
          submissionStatusUpdatedBy: auditUser,
          modifier: auditUser,
          updatedAt: now,
        },
      );
    });
  }
}

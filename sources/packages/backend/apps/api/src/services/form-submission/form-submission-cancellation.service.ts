import { Injectable } from "@nestjs/common";
import {
  FORM_SUBMISSION_CANCELLED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_NOT_PENDING,
  FORM_SUBMISSION_WITH_MINISTRY_DECISION,
  FormSubmissionService,
} from "..";
import { DataSource, EntityManager, In, Not } from "typeorm";
import {
  FormSubmission,
  FormSubmissionCancellationReason,
  FormSubmissionStatus,
} from "@sims/sims-db";
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
  private async validate(
    submissionId: number,
    entityManager: EntityManager,
    options?: { studentId?: number },
  ): Promise<void> {
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
    cancellationReason: FormSubmissionCancellationReason,
    auditUserId: number,
    options?: { studentId?: number },
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      // Acquire a DB lock for the form submission to prevent concurrent updates.
      await this.formSubmissionService.acquireLockOnFormSubmission(
        entityManager,
        {
          submissionId,
        },
      );
      await this.validate(submissionId, entityManager, options);
      await this.processCancellations(
        [submissionId],
        cancellationReason,
        auditUserId,
        entityManager,
      );
    });
  }

  /**
   * Cancel all the form submissions associated with the given application.
   * @param applicationId The ID of the application whose form submissions are to be cancelled.
   * @param cancellationReason The reason for cancelling the form submissions.
   * @param auditUserId The ID of the user performing the cancellation.
   * @param entityManager The entity manager to execute in transaction.
   */
  async cancelApplicationScopedFormSubmissions(
    applicationId: number,
    cancellationReason: FormSubmissionCancellationReason,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const formSubmissionRepo = entityManager.getRepository(FormSubmission);
    // Acquire a DB lock for the form submissions to prevent concurrent updates.
    const formSubmissionsToCancel = await formSubmissionRepo.find({
      select: { id: true },
      where: {
        application: { id: applicationId },
        submissionStatus: Not(FormSubmissionStatus.Cancelled),
      },
      lock: { mode: "pessimistic_write" },
    });
    // If there is no pending form submission to cancel then return.
    if (!formSubmissionsToCancel.length) {
      return;
    }
    await this.processCancellations(
      formSubmissionsToCancel.map((submission) => submission.id),
      cancellationReason,
      auditUserId,
      entityManager,
    );
  }

  /**
   * Process the cancellation of a form submission.
   * The process currently involves updating the form submission status to 'Cancelled' and setting the cancellation reason.
   * @param formSubmissionId form submission ID to cancel.
   * @param cancellationReason reason for the cancellation of the form submission.
   * @param auditUserId ID of the user performing the cancellation.
   * @param entityManager entity manager to execute in transaction.
   */
  private async processCancellations(
    formSubmissionIds: number[],
    cancellationReason: FormSubmissionCancellationReason,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const now = new Date();
    const auditUser = { id: auditUserId };
    await entityManager.getRepository(FormSubmission).update(
      { id: In(formSubmissionIds) },
      {
        submissionStatus: FormSubmissionStatus.Cancelled,
        cancellationReason,
        submissionStatusUpdatedOn: now,
        submissionStatusUpdatedBy: auditUser,
        modifier: auditUser,
        updatedAt: now,
      },
    );
  }
}

import {
  FormSubmissionCancellationReason,
  FormSubmissionStatus,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils";

/**
 * Verify if all the application scoped form submissions are cancelled.
 * @param db E2EDataSources instance to access the database.
 * @param applicationId form submission application ID.
 * @param cancellationReason form submission cancellation reason.
 * @param expectedFormSubmissionIds  expected form submission IDs that should be cancelled.
 * @param auditUser user who performed the cancellation.
 * @param auditDate date when the cancellation was performed.
 */
export async function assertCancelledApplicationScopedFormSubmissions(
  db: E2EDataSources,
  applicationId: number,
  cancellationReason: FormSubmissionCancellationReason,
  expectedFormSubmissionIds: number[],
  auditUserId: number,
  auditDate: Date,
): Promise<void> {
  // Verify if all the application scoped form submissions are cancelled.
  const updatedFormSubmissions = await db.formSubmission.find({
    select: {
      id: true,
      submissionStatus: true,
      cancellationReason: true,
      submissionStatusUpdatedBy: { id: true },
      submissionStatusUpdatedOn: true,
      modifier: { id: true },
      updatedAt: true,
    },
    relations: { submissionStatusUpdatedBy: true, modifier: true },
    where: {
      application: { id: applicationId },
    },
    order: { id: "ASC" },
    loadEagerRelations: false,
  });
  const auditUser = { id: auditUserId };
  expect(updatedFormSubmissions).toEqual(
    expectedFormSubmissionIds.map((id) => ({
      id,
      submissionStatus: FormSubmissionStatus.Cancelled,
      cancellationReason,
      submissionStatusUpdatedBy: auditUser,
      submissionStatusUpdatedOn: auditDate,
      modifier: auditUser,
      updatedAt: auditDate,
    })),
  );
}

/**
 * Verify if a form submission was not updated.
 * @param db E2EDataSources instance to access the database.
 * @param formSubmissionId form submission ID.
 * @param notExpectedCancellationReason cancellation reason that should not be set.
 * @param notExpectedSubmissionStatusDate submission status date that should not be set.
 */
export async function assertFormSubmissionNotUpdated(
  db: E2EDataSources,
  formSubmissionId: number,
  notExpectedCancellationReason: FormSubmissionCancellationReason,
  notExpectedSubmissionStatusDate: Date,
): Promise<void> {
  const formSubmission = await db.formSubmission.findOne({
    select: {
      id: true,
      submissionStatusUpdatedOn: true,
      cancellationReason: true,
    },
    where: { id: formSubmissionId },
  });
  expect(formSubmission.cancellationReason).not.toBe(
    notExpectedCancellationReason,
  );
  expect(formSubmission.submissionStatusUpdatedOn).not.toEqual(
    notExpectedSubmissionStatusDate,
  );
}

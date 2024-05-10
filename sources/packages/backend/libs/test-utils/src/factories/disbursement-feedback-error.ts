import {
  DisbursementFeedbackErrors,
  DisbursementSchedule,
  ECertFeedbackError,
} from "@sims/sims-db";

/**
 * Creates a new disbursement feedback error.
 * @param relations dependencies.
 * - `disbursementSchedule` associated disbursement schedule.
 * - `eCertFeedbackError` feedback error received.
 * @param options additional options.
 * - `initialValues` initial feedback error record values.
 * @returns disbursement feedback error to be saved.
 */
export function createFakeDisbursementFeedbackError(
  relations: {
    disbursementSchedule: DisbursementSchedule;
    eCertFeedbackError: ECertFeedbackError;
  },
  options?: {
    initialValues?: Partial<DisbursementFeedbackErrors>;
  },
): DisbursementFeedbackErrors {
  const now = new Date();
  const feedbackError = new DisbursementFeedbackErrors();
  feedbackError.dateReceived = options?.initialValues?.dateReceived ?? now;
  feedbackError.disbursementSchedule = relations.disbursementSchedule;
  feedbackError.eCertFeedbackError = relations.eCertFeedbackError;
  feedbackError.updatedAt = options?.initialValues?.updatedAt ?? now;
  return feedbackError;
}

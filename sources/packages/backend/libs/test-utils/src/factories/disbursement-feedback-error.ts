import {
  DisbursementFeedbackErrors,
  DisbursementSchedule,
  ECertFeedbackError,
} from "@sims/sims-db";

/**
 * Creates a new disbursement feedback error.
 * @param relations dependencies.
 * - `disbursementSchedule` associated disbursement schedule.
 * @param options additional options.
 * - `initialValues` initial feedback error record values.
 * @returns disbursement feedback error to be saved.
 */
export function createFakeDisbursementFeedbackError(
  relations: {
    disbursementSchedule: DisbursementSchedule;
    ecertFeedbackError: ECertFeedbackError;
  },
  options?: {
    initialValues?: Partial<DisbursementFeedbackErrors>;
  },
): DisbursementFeedbackErrors {
  const now = new Date();
  const feedbackError = new DisbursementFeedbackErrors();
  feedbackError.dateReceived = options?.initialValues?.dateReceived ?? now;
  feedbackError.errorCode = options?.initialValues?.errorCode ?? "EDU-99999";
  feedbackError.disbursementSchedule = relations.disbursementSchedule;
  feedbackError.updatedAt = options?.initialValues?.updatedAt ?? now;
  return feedbackError;
}

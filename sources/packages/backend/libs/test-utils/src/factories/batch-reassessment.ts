import {
  BatchReassessment,
  BatchReassessmentStatus,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";

/**
 * Creates a fake batch reassessment for testing purposes.
 * @param relations optional relations.
 * - `creator` user that created the batch reassessment.
 * @param options initial values for the batch reassessment.
 * - `initialValue` values that override the default batch reassessment values.
 * @returns a new batch reassessment to be saved to the database.
 */
export function createFakeBatchReassessment(
  relations?: {
    creator?: User;
  },
  options?: {
    initialValue?: Partial<BatchReassessment>;
  },
): BatchReassessment {
  const batchReassessment = new BatchReassessment();
  batchReassessment.batchNumber =
    options?.initialValue?.batchNumber ?? faker.number.int(1000);
  batchReassessment.status =
    options?.initialValue?.status ?? BatchReassessmentStatus.InProgress;
  batchReassessment.creator = relations?.creator;
  batchReassessment.createdAt = options?.initialValue?.createdAt ?? new Date();
  return batchReassessment;
}

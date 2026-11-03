import { BatchRestriction, Restriction, User } from "@sims/sims-db";
import { faker } from "@faker-js/faker";

/**
 * Creates a fake batch restriction for testing purposes.
 * @param relations required and optional relations.
 * - `restriction` restriction added to the students in the batch.
 * - `creator` user that created the batch restriction.
 * @param options initial values for the batch restriction.
 * - `initialValues` values that override the default batch restriction values.
 * @returns a new batch restriction to be saved to the database.
 */
export function createFakeBatchRestriction(
  relations: {
    restriction: Restriction;
    creator?: User;
  },
  options?: {
    initialValues?: Partial<BatchRestriction>;
  },
): BatchRestriction {
  const batchRestriction = new BatchRestriction();
  batchRestriction.batchNumber =
    options?.initialValues?.batchNumber ??
    faker.number.int({ min: 100000, max: 999999 });
  batchRestriction.restriction = relations.restriction;
  batchRestriction.creator = relations.creator;
  batchRestriction.createdAt = options?.initialValues?.createdAt ?? new Date();
  return batchRestriction;
}
